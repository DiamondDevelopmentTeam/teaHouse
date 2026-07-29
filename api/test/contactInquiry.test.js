import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/lib/config.js';
import { createContactInquiryHandler } from '../src/functions/contactInquiry.js';
import { sendInquiryEmail } from '../src/lib/graphMail.js';
import { RecaptchaError, verifyRecaptcha } from '../src/lib/recaptcha.js';
import { ValidationError, validateContactInquiry } from '../src/lib/validation.js';

const config = Object.freeze({
  tenantId: 'tenant-placeholder',
  clientId: 'client-placeholder',
  clientSecret: 'secret-placeholder',
  graphSenderEmail: 'sender@example.test',
  inquiryRecipientEmail: 'recipient@example.test',
  recaptchaSecretKey: 'recaptcha-placeholder',
  allowedOrigins: ['http://localhost:5173', 'https://diamonddevelopmentteam.github.io'],
  allowedRecaptchaHostnames: ['localhost', 'diamonddevelopmentteam.github.io'],
});

const validBody = Object.freeze({
  name: 'Visitor Name',
  email: 'visitor@example.com',
  phone: '',
  topic: 'General question',
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

test('topics are trimmed but values outside the allowlist are rejected', () => {
  assert.equal(
    validateContactInquiry({ ...validBody, topic: '  General question  ' }).topic,
    'General question',
  );
  assert.throws(
    () => validateContactInquiry({ ...validBody, topic: 'Billing' }),
    (error) => error instanceof ValidationError && error.code === 'topic_invalid',
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

test('Graph receives a normalized plain-text payload with fixed sender and recipient', async () => {
  let credentialArguments;
  let graphRequest;
  const inquiry = validateContactInquiry({
    ...validBody,
    name: '  Visitor Name  ',
    message: 'Hello\u0000 <script>alert("no")</script>',
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

  const payload = JSON.parse(graphRequest.options.body);
  assert.deepEqual(credentialArguments, [
    config.tenantId,
    config.clientId,
    config.clientSecret,
  ]);
  assert.equal(
    graphRequest.url,
    'https://graph.microsoft.com/v1.0/users/sender%40example.test/sendMail',
  );
  assert.equal(payload.message.body.contentType, 'Text');
  assert.equal(payload.message.body.content.includes('\u0000'), false);
  assert.match(payload.message.body.content, /Hello <script>alert\("no"\)<\/script>/);
  assert.equal(
    payload.message.toRecipients[0].emailAddress.address,
    config.inquiryRecipientEmail,
  );
  assert.equal(payload.message.replyTo[0].emailAddress.address, validBody.email);
  assert.equal(payload.saveToSentItems, true);
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
    message: 'The contact service is temporarily unavailable.',
  });
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
