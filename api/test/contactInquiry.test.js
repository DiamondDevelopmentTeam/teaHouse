import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/lib/config.js';
import { createContactInquiryHandler } from '../src/functions/contactInquiry.js';
import { buildInquiryEmailContent, sendInquiryEmail } from '../src/lib/graphMail.js';
import { RecaptchaError, verifyRecaptcha } from '../src/lib/recaptcha.js';
import { ValidationError, validateContactInquiry } from '../src/lib/validation.js';

const config = Object.freeze({
  tenantId: 'tenant-placeholder',
  clientId: 'client-placeholder',
  clientSecret: 'secret-placeholder',
  graphSenderEmail: 'sender@example.test',
  inquiryRecipientEmail: 'ashley@1890teahouse.com',
  recaptchaSecretKey: 'recaptcha-placeholder',
  allowedOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://diamonddevelopmentteam.github.io',
  ],
  allowedRecaptchaHostnames: ['localhost', 'diamonddevelopmentteam.github.io'],
});

const validBody = Object.freeze({
  name: 'Visitor Name',
  email: 'visitor@example.com',
  phone: '352-555-0123',
  inquiryType: 'General question',
  preferredDate: '2026-08-15',
  guestCount: '8',
  message: 'Could you tell me about afternoon tea?',
  recaptchaToken: 'browser-token',
  website: '',
});

function request({
  method = 'POST',
  origin = 'http://localhost:5173',
  contentType = 'application/json',
  body = validBody,
} = {}) {
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    method,
    headers: new Headers({
      ...(origin ? { Origin: origin } : {}),
      ...(contentType ? { 'Content-Type': contentType } : {}),
      'Content-Length': String(Buffer.byteLength(rawBody)),
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
    now: () => '2026-07-29T20:00:00.000Z',
    requestIdFactory: () => 'request-id',
    ...overrides,
  });
}

test('required fields are rejected', () => {
  assert.throws(
    () => validateContactInquiry({ ...validBody, name: '   ' }),
    (error) => error instanceof ValidationError && error.code === 'name_required',
  );
});

test('phone, preferred date, and guest count are required', () => {
  for (const field of ['phone', 'preferredDate', 'guestCount']) {
    assert.throws(
      () => validateContactInquiry({ ...validBody, [field]: '' }),
      (error) => error instanceof ValidationError && error.code === `${field}_required`,
    );
  }
});

test('invalid phone numbers are rejected', () => {
  assert.throws(
    () => validateContactInquiry({ ...validBody, phone: 'call me' }),
    (error) => error instanceof ValidationError && error.code === 'phone_invalid',
  );
});

test('invalid email is rejected', () => {
  assert.throws(
    () => validateContactInquiry({ ...validBody, email: 'not-an-email' }),
    (error) => error instanceof ValidationError && error.code === 'email_invalid',
  );
});

test('an overly long message is rejected', () => {
  assert.throws(
    () => validateContactInquiry({ ...validBody, message: 'x'.repeat(5001) }),
    (error) => error instanceof ValidationError && error.code === 'message_too_long',
  );
});

test('inquiry types are trimmed but values outside the allowlist are rejected', () => {
  assert.equal(
    validateContactInquiry({ ...validBody, inquiryType: '  General question  ' }).inquiryType,
    'General question',
  );
  assert.throws(
    () => validateContactInquiry({ ...validBody, inquiryType: 'Billing' }),
    (error) => error instanceof ValidationError && error.code === 'inquiryType_invalid',
  );
});

test('preferred date and guest count are validated', () => {
  assert.throws(
    () => validateContactInquiry({ ...validBody, preferredDate: '2026-02-30' }),
    (error) => error instanceof ValidationError && error.code === 'preferredDate_invalid',
  );
  assert.throws(
    () => validateContactInquiry({ ...validBody, guestCount: '501' }),
    (error) => error instanceof ValidationError && error.code === 'guestCount_invalid',
  );
});

test('honeypot submissions are rejected', () => {
  assert.throws(
    () => validateContactInquiry({ ...validBody, website: 'https://spam.example' }),
    (error) => error instanceof ValidationError && error.code === 'honeypot',
  );
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

test('a reCAPTCHA response from an invalid hostname is rejected', async () => {
  await assert.rejects(
    verifyRecaptcha({
      token: 'browser-token',
      secret: 'secret-placeholder',
      allowedHostnames: ['localhost'],
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ success: true, hostname: 'untrusted.example' }),
      }),
    }),
    (error) => error instanceof RecaptchaError && error.code === 'invalid_hostname',
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

test('Graph receives a sanitized multipart email with fixed sender and recipient', async () => {
  let credentialArguments;
  let graphRequest;
  const inquiry = validateContactInquiry({
    ...validBody,
    name: '  Visitor\nName  ',
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
  assert.equal(graphRequest.options.headers['Content-Type'], 'text/plain');
  assert.match(mimeMessage, /^From: Tea House Inquiry <sender@example\.test>\r?$/m);
  assert.match(mimeMessage, /^To: ashley@1890teahouse\.com\r?$/m);
  assert.match(mimeMessage, /^Reply-To: .+ <visitor@example\.com>\r?$/m);
  assert.match(mimeMessage, /Content-Type: multipart\/alternative/);
  assert.match(mimeMessage, /Content-Type: text\/plain; charset="UTF-8"/);
  assert.match(mimeMessage, /Content-Type: text\/html; charset="UTF-8"/);
  assert.equal(inquiry.name, 'Visitor Name');
  assert.equal(emailContent.plainText.includes('\u0000'), false);
  assert.match(emailContent.plainText, /Website source: 1890 Tea House website contact form/);
  assert.match(emailContent.html, /Reply to/);
  assert.match(emailContent.html, /Visitor Name &lt;visitor@example\.com&gt;/);
  assert.match(emailContent.html, /Hello &lt;script&gt;alert\(&quot;no&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(emailContent.html, /<script>/);
});

test('configuration enforces the server-side inquiry recipient', () => {
  const environment = {
    AZURE_TENANT_ID: 'tenant-placeholder',
    AZURE_CLIENT_ID: 'client-placeholder',
    AZURE_CLIENT_SECRET: 'secret-placeholder',
    GRAPH_SENDER_EMAIL: 'sender@example.test',
    INQUIRY_RECIPIENT_EMAIL: 'different@example.test',
  };

  assert.throws(() => loadConfig(environment), /contact service is not configured/i);
});

test('default CORS origins and an optional custom origin are loaded server-side', () => {
  const loaded = loadConfig({
    AZURE_TENANT_ID: 'tenant-placeholder',
    AZURE_CLIENT_ID: 'client-placeholder',
    AZURE_CLIENT_SECRET: 'secret-placeholder',
    GRAPH_SENDER_EMAIL: 'sender@example.test',
    INQUIRY_RECIPIENT_EMAIL: 'ashley@1890teahouse.com',
    ADDITIONAL_ALLOWED_ORIGINS: 'https://www.1890teahouse.com',
  });

  assert.deepEqual(loaded.allowedOrigins, [
    'https://diamonddevelopmentteam.github.io',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://www.1890teahouse.com',
  ]);
  assert.equal(loaded.recaptchaSecretKey, '');
});

test('reCAPTCHA is optional but its server settings must be configured together', () => {
  const baseEnvironment = {
    AZURE_TENANT_ID: 'tenant-placeholder',
    AZURE_CLIENT_ID: 'client-placeholder',
    AZURE_CLIENT_SECRET: 'secret-placeholder',
    GRAPH_SENDER_EMAIL: 'sender@example.test',
    INQUIRY_RECIPIENT_EMAIL: 'ashley@1890teahouse.com',
  };

  assert.throws(
    () => loadConfig({ ...baseEnvironment, RECAPTCHA_SECRET_KEY: 'secret-placeholder' }),
    /contact service is not configured/i,
  );
  assert.doesNotThrow(() => loadConfig(baseEnvironment));
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

test('missing backend configuration returns a generic service error', async () => {
  const response = await handler({
    configProvider: () => loadConfig({}),
  })(request(), context());

  assert.equal(response.status, 503);
  assert.deepEqual(response.jsonBody, {
    ok: false,
    error: {
      code: 'service_unavailable',
      message: 'The contact service is temporarily unavailable.',
    },
    message: 'The contact service is temporarily unavailable.',
    requestId: 'request-id',
  });
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

test('invalid JSON and unsupported content types are rejected before dependencies run', async () => {
  let dependencyCalls = 0;
  const guardedHandler = handler({
    verifyRecaptchaFn: async () => {
      dependencyCalls += 1;
    },
    sendInquiryEmailFn: async () => {
      dependencyCalls += 1;
    },
  });

  const invalidJsonResponse = await guardedHandler(request({ body: '{' }), context());
  const unsupportedResponse = await guardedHandler(
    request({ contentType: 'text/plain' }),
    context(),
  );

  assert.equal(invalidJsonResponse.status, 400);
  assert.equal(unsupportedResponse.status, 415);
  assert.equal(dependencyCalls, 0);
});

test('request bodies over the size limit are rejected', async () => {
  const response = await handler()(
    request({ body: JSON.stringify({ padding: 'x'.repeat(16 * 1024) }) }),
    context(),
  );

  assert.equal(response.status, 413);
});
