import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/lib/config.js';
import { createContactInquiryHandler } from '../src/functions/contactInquiry.js';
import {
  FORM_SUBJECTS,
  buildInquiryEmailContent,
  sendInquiryEmail,
} from '../src/lib/graphMail.js';
import { createRateLimiter } from '../src/lib/rateLimit.js';
import { RecaptchaError, verifyRecaptcha } from '../src/lib/recaptcha.js';
import {
  ValidationError,
  validateInquirySubmission,
} from '../src/lib/validation.js';

const config = Object.freeze({
  tenantId: 'tenant-placeholder',
  clientId: 'client-placeholder',
  clientSecret: 'secret-placeholder',
  graphSenderEmail: 'sender@example.test',
  inquiryRecipientEmail: 'beatriz@diamondpeo.com',
  recaptchaSecretKey: 'recaptcha-placeholder',
  allowedOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://diamonddevelopmentteam.github.io',
  ],
  allowedRecaptchaHostnames: ['localhost', 'diamonddevelopmentteam.github.io'],
});

const validBody = Object.freeze({
  formType: 'general',
  name: 'Visitor Name',
  email: 'visitor@example.com',
  phone: '352-555-0123',
  preferredDate: '2026-08-15',
  preferredTime: '',
  guestCount: '8',
  inquiryCategory: 'General question',
  message: 'Could you tell me about afternoon tea?',
  pageUrl: 'https://diamonddevelopmentteam.github.io/teaHouse/contact',
  preOrders: [],
  policyAgreement: false,
  recaptchaToken: 'browser-token',
  website: '',
});

function request({
  method = 'POST',
  origin = 'http://localhost:5173',
  contentType = 'application/json',
  body = validBody,
  clientIp = '203.0.113.10',
} = {}) {
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    method,
    headers: new Headers({
      ...(origin ? { Origin: origin } : {}),
      ...(contentType ? { 'Content-Type': contentType } : {}),
      'Content-Length': String(Buffer.byteLength(rawBody)),
      'X-Forwarded-For': clientIp,
    }),
    text: async () => rawBody,
  };
}

function context() {
  return { log() {}, warn() {}, error() {} };
}

function handler(overrides = {}) {
  return createContactInquiryHandler({
    configProvider: () => config,
    verifyRecaptchaFn: async () => ({ hostname: 'localhost' }),
    sendInquiryEmailFn: async () => {},
    rateLimiter: { check: () => ({ allowed: true, retryAfterSeconds: 0 }) },
    now: () => '2026-07-29T20:00:00.000Z',
    requestIdFactory: () => 'request-id',
    ...overrides,
  });
}

test('all common submission fields are required', () => {
  for (const field of [
    'formType',
    'name',
    'email',
    'phone',
    'preferredDate',
    'guestCount',
    'inquiryCategory',
    'message',
    'pageUrl',
  ]) {
    assert.throws(
      () => validateInquirySubmission({ ...validBody, [field]: '' }),
      (error) => error instanceof ValidationError && error.code === `${field}_required`,
    );
  }
});

test('email, phone, date, time, guest count, page URL, and lengths are validated', () => {
  const invalidCases = [
    ['email', 'not-an-email', 'email_invalid'],
    ['phone', 'call me', 'phone_invalid'],
    ['preferredDate', '2026-02-30', 'preferredDate_invalid'],
    ['preferredTime', '29:70', 'preferredTime_invalid'],
    ['guestCount', '501', 'guestCount_invalid'],
    ['pageUrl', 'javascript:alert(1)', 'pageUrl_invalid'],
    ['message', 'x'.repeat(5001), 'message_too_long'],
  ];

  for (const [field, value, code] of invalidCases) {
    assert.throws(
      () => validateInquirySubmission({ ...validBody, [field]: value }),
      (error) => error instanceof ValidationError && error.code === code,
    );
  }
});

test('form types, categories, pre-orders, and the honeypot are allowlisted', () => {
  const invalidCases = [
    ['formType', 'employment', 'formType_invalid'],
    ['inquiryCategory', 'Billing', 'inquiryCategory_invalid'],
    ['preOrders', ['Unknown package'], 'preOrders_invalid'],
    ['website', 'https://spam.example', 'honeypot'],
  ];

  for (const [field, value, code] of invalidCases) {
    assert.throws(
      () => validateInquirySubmission({ ...validBody, [field]: value }),
      (error) => error instanceof ValidationError && error.code === code,
    );
  }
});

test('reservation requests require server-side policy agreement', () => {
  assert.throws(
    () => validateInquirySubmission({
      ...validBody,
      formType: 'reservation',
      inquiryCategory: 'Tea Room',
      policyAgreement: false,
    }),
    (error) =>
      error instanceof ValidationError && error.code === 'policyAgreement_required',
  );
});

test('visitor fields are normalized and control characters are removed', () => {
  const inquiry = validateInquirySubmission({
    ...validBody,
    name: '  Visitor\nName  ',
    message: 'Hello\u0000 there',
  });

  assert.equal(inquiry.name, 'Visitor Name');
  assert.equal(inquiry.message, 'Hello there');
});

test('failed reCAPTCHA verification fails closed', async () => {
  await assert.rejects(
    verifyRecaptcha({
      token: 'browser-token',
      secret: 'secret-placeholder',
      allowedHostnames: ['localhost'],
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ success: false }),
      }),
    }),
    (error) => error instanceof RecaptchaError && error.code === 'rejected',
  );
});

test('Graph is not called when reCAPTCHA fails', async () => {
  let graphCalls = 0;
  const response = await handler({
    verifyRecaptchaFn: async () => {
      throw new RecaptchaError('rejected');
    },
    sendInquiryEmailFn: async () => {
      graphCalls += 1;
    },
  })(request(), context());

  assert.equal(response.status, 400);
  assert.equal(graphCalls, 0);
});

test('the handler skips reCAPTCHA when it is not configured', async () => {
  let verificationCalls = 0;
  const response = await handler({
    configProvider: () => ({
      ...config,
      recaptchaSecretKey: '',
      allowedRecaptchaHostnames: [],
    }),
    verifyRecaptchaFn: async () => {
      verificationCalls += 1;
    },
  })(request({ body: { ...validBody, recaptchaToken: '' } }), context());

  assert.equal(response.status, 202);
  assert.equal(response.jsonBody.ok, true);
  assert.equal(verificationCalls, 0);
});

test('all form types have the required email subject', () => {
  assert.deepEqual(FORM_SUBJECTS, {
    general: '1890 Tea House – General Inquiry',
    reservation: '1890 Tea House – Reservation Request',
    event: '1890 Tea House – Event Inquiry',
    contact: '1890 Tea House – Contact Request',
  });
});

test('Graph receives a sanitized multipart email with fixed server recipient', async () => {
  let credentialArguments;
  let graphRequest;
  const inquiry = validateInquirySubmission({
    ...validBody,
    message: 'Hello\u0000 <script>alert("no")</script>',
  });
  const emailContent = buildInquiryEmailContent(inquiry, {
    submittedAt: '2026-07-29T20:00:00.000Z',
    requestId: 'request-id',
  });

  await sendInquiryEmail({
    inquiry,
    config,
    submittedAt: '2026-07-29T20:00:00.000Z',
    requestId: 'request-id',
    credentialFactory: (...args) => {
      credentialArguments = args;
      return { getToken: async () => ({ token: 'access-token-placeholder' }) };
    },
    fetchImpl: async (url, options) => {
      graphRequest = { url, options };
      return { ok: true, status: 202 };
    },
  });

  const mimeMessage = Buffer.from(graphRequest.options.body, 'base64').toString('utf8');
  assert.deepEqual(credentialArguments, [
    config.tenantId,
    config.clientId,
    config.clientSecret,
  ]);
  assert.equal(
    graphRequest.url,
    'https://graph.microsoft.com/v1.0/users/sender%40example.test/sendMail',
  );
  assert.match(mimeMessage, /^To: beatriz@diamondpeo\.com\r?$/m);
  assert.match(mimeMessage, /^Reply-To: .+ <visitor@example\.com>\r?$/m);
  assert.match(mimeMessage, /^Subject: =\?UTF-8\?B\?.+\?=\r?$/m);
  assert.match(mimeMessage, /Content-Type: multipart\/alternative/);
  assert.match(emailContent.plainText, /Form type: general/);
  assert.match(emailContent.plainText, /Page URL: https:\/\/diamonddevelopmentteam/);
  assert.match(emailContent.html, /Hello &lt;script&gt;alert\(&quot;no&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(emailContent.html, /<script>/);
});

test('configuration enforces the server-side recipient', () => {
  const environment = {
    AZURE_TENANT_ID: 'tenant-placeholder',
    AZURE_CLIENT_ID: 'client-placeholder',
    AZURE_CLIENT_SECRET: 'secret-placeholder',
    GRAPH_SENDER_EMAIL: 'sender@example.test',
    INQUIRY_RECIPIENT_EMAIL: 'different@example.test',
  };

  assert.throws(() => loadConfig(environment), /submission service is not configured/i);
});

test('default CORS origins and an optional custom origin are loaded server-side', () => {
  const loaded = loadConfig({
    AZURE_TENANT_ID: 'tenant-placeholder',
    AZURE_CLIENT_ID: 'client-placeholder',
    AZURE_CLIENT_SECRET: 'secret-placeholder',
    GRAPH_SENDER_EMAIL: 'sender@example.test',
    INQUIRY_RECIPIENT_EMAIL: 'beatriz@diamondpeo.com',
    ADDITIONAL_ALLOWED_ORIGINS: 'https://www.1890teahouse.com',
  });

  assert.deepEqual(loaded.allowedOrigins, [
    'https://diamonddevelopmentteam.github.io',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://www.1890teahouse.com',
  ]);
});

test('a disallowed CORS origin receives no allow-origin header', async () => {
  const response = await handler()(
    request({ origin: 'https://untrusted.example' }),
    context(),
  );

  assert.equal(response.status, 403);
  assert.equal(response.headers['Access-Control-Allow-Origin'], undefined);
});

test('OPTIONS preflight returns CORS headers for an allowed origin', async () => {
  const response = await handler()(
    request({ method: 'OPTIONS', body: '' }),
    context(),
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'http://localhost:5173');
  assert.equal(response.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('rate limiting returns a structured 429 response', async () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 1_000 });
  const guardedHandler = handler({ rateLimiter: limiter });

  assert.equal((await guardedHandler(request(), context())).status, 202);
  const response = await guardedHandler(request(), context());

  assert.equal(response.status, 429);
  assert.equal(response.jsonBody.error.code, 'rate_limited');
  assert.equal(response.headers['Retry-After'], '60');
});

test('missing backend configuration returns a generic service error with request ID', async () => {
  const response = await handler({
    configProvider: () => loadConfig({}),
  })(request(), context());

  assert.equal(response.status, 503);
  assert.equal(response.jsonBody.error.code, 'service_unavailable');
  assert.equal(response.jsonBody.requestId, 'request-id');
});

test('invalid JSON, unsupported content types, and oversized bodies are rejected', async () => {
  const guardedHandler = handler();
  const invalidJsonResponse = await guardedHandler(request({ body: '{' }), context());
  const unsupportedResponse = await guardedHandler(
    request({ contentType: 'text/plain' }),
    context(),
  );
  const oversizedResponse = await guardedHandler(
    request({ body: JSON.stringify({ padding: 'x'.repeat(16 * 1024) }) }),
    context(),
  );

  assert.equal(invalidJsonResponse.status, 400);
  assert.equal(unsupportedResponse.status, 415);
  assert.equal(oversizedResponse.status, 413);
});
