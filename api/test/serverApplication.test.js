import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerApplicationConfig } from '../src/lib/config.js';
import { createServerApplicationHandler } from '../src/functions/serverApplication.js';
import { GraphMailError } from '../src/lib/graphMail.js';
import {
  buildServerApplicationEmail,
  buildServerApplicationGraphPayload,
  sendServerApplicationEmail,
} from '../src/lib/serverApplicationMail.js';
import {
  ApplicationValidationError,
  validateServerApplicationFormData,
} from '../src/lib/serverApplicationValidation.js';
import { RecaptchaError } from '../src/lib/recaptcha.js';

const allowedOrigins = ['http://localhost:5173', 'https://diamonddevelopmentteam.github.io'];
const config = Object.freeze({
  tenantId: 'tenant-placeholder',
  clientId: 'client-placeholder',
  clientSecret: 'secret-placeholder',
  graphSenderEmail: 'donotreply@diamondpeo.com',
  inquiryRecipientEmail: 'beatriz@diamondpeo.com',
  serverApplicationRecipientEmail: 'hiring@example.com',
  recaptchaSecretKey: 'recaptcha-placeholder',
  allowedOrigins,
  allowedRecaptchaHostnames: ['localhost', 'diamonddevelopmentteam.github.io'],
});

const availability = [
  { day: 'Monday', available: false, earliest: '', latest: '' },
  { day: 'Tuesday', available: false, earliest: '', latest: '' },
  { day: 'Wednesday', available: true, earliest: '10:00', latest: '18:00' },
  { day: 'Thursday', available: true, earliest: '10:00', latest: '18:00' },
  { day: 'Friday', available: true, earliest: '12:00', latest: '20:00' },
  { day: 'Saturday', available: true, earliest: '12:00', latest: '20:00' },
  { day: 'Sunday', available: true, earliest: '10:00', latest: '16:00' },
];

function validFormData(overrides = {}, resume) {
  const fields = {
    position: 'Server',
    applicationDate: '2026-08-05',
    availableStartDate: '2026-08-20',
    desiredEmployment: 'Either',
    availability: JSON.stringify(availability),
    availableWeekends: 'Yes',
    availableHolidays: 'Yes',
    firstName: 'Avery',
    lastName: 'Applicant',
    phone: '352-555-0144',
    email: 'avery@example.com',
    streetAddress: '100 Main Street',
    city: 'Ocala',
    state: 'FL',
    zipCode: '34470-1234',
    isAdult: 'Yes',
    workAuthorized: 'Yes',
    whyWorkHere: 'I enjoy gracious service and creating a welcoming guest experience.',
    certifications: 'Food handler certificate',
    educationLevel: 'Some college',
    schoolName: 'Central College',
    reference1Name: 'Reference One',
    reference1Phone: '352-555-0101',
    reference1Relationship: 'Former supervisor',
    reference2Name: 'Reference Two',
    reference2Phone: '352-555-0102',
    reference2Relationship: 'Colleague',
    backgroundCheck: 'Yes',
    certification: 'true',
    signatureName: 'Avery Applicant',
    signatureDate: '2026-08-05',
    pageUrl: 'https://diamonddevelopmentteam.github.io/teaHouse/server-application',
    recaptchaToken: 'verified-browser-token',
    website: '',
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  data.append('experience', 'Customer service experience');
  data.append('experience', 'POS or cash register experience');
  if (resume) data.set('resume', resume);
  return data;
}

function validPdf({ name = 'Avery Resume.pdf', type = 'application/pdf' } = {}) {
  return new File([Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF')], name, { type });
}

function request(formData = validFormData(), {
  origin = 'http://localhost:5173',
  contentType = 'multipart/form-data; boundary=test-boundary',
  contentLength = '4096',
} = {}) {
  return {
    method: 'POST',
    headers: new Headers({
      Origin: origin,
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'X-Forwarded-For': '203.0.113.25',
    }),
    formData: async () => formData,
  };
}

function context(logs = []) {
  return {
    log(value) { logs.push(value); },
    warn(value) { logs.push(value); },
    error(value) { logs.push(value); },
  };
}

function handler(overrides = {}) {
  return createServerApplicationHandler({
    configProvider: () => config,
    verifyRecaptchaFn: async () => ({ hostname: 'localhost' }),
    sendApplicationEmailFn: async () => {},
    rateLimiter: { check: () => ({ allowed: true, retryAfterSeconds: 0 }) },
    duplicateGuard: { claim: () => true, release() {}, complete() {} },
    now: () => '2026-08-05T18:30:00.000Z',
    requestIdFactory: () => 'application-request-id',
    ...overrides,
  });
}

test('valid application without a résumé is accepted by the dedicated schema', async () => {
  const application = await validateServerApplicationFormData(validFormData());
  assert.equal(application.position, 'Server');
  assert.equal(application.resume, null);
  assert.equal(application.availability.length, 7);
  assert.equal(application.references.length, 2);
});

test('valid PDF résumé is sanitized and retained only as validated bytes', async () => {
  const application = await validateServerApplicationFormData(
    validFormData({}, validPdf({ name: '../Avery Résumé.pdf' })),
  );
  assert.equal(application.resume.filename, 'Avery R_sum_.pdf');
  assert.equal(application.resume.contentType, 'application/pdf');
  assert.match(application.resume.bytes.toString('ascii'), /^%PDF-/);
  application.resume.bytes.fill(0);
});

test('required certification, expected fields, markup, and availability ranges are enforced', async () => {
  const cases = [
    [validFormData({ certification: '' }), 'certification_required'],
    [validFormData({ whyWorkHere: '<script>alert(1)</script>' }), 'whyWorkHere_disallowed_content'],
    [validFormData({ availability: JSON.stringify(availability.map((item) => ({ ...item, available: false, earliest: '', latest: '' }))) }), 'availability_required'],
    [validFormData({ availability: JSON.stringify(availability.map((item) => item.day === 'Wednesday' ? { ...item, earliest: '18:00', latest: '10:00' } : item)) }), 'availability_range_invalid'],
  ];
  const unexpected = validFormData();
  unexpected.set('recipientEmail', 'attacker@example.com');
  cases.push([unexpected, 'unexpected_field']);
  for (const [data, code] of cases) {
    await assert.rejects(
      () => validateServerApplicationFormData(data),
      (error) => error instanceof ApplicationValidationError && error.code === code,
    );
  }
});

test('oversized, unsupported, and mismatched résumé files are rejected', async () => {
  const cases = [
    [new File([new Uint8Array((5 * 1024 * 1024) + 1)], 'resume.pdf', { type: 'application/pdf' }), 'resume_too_large'],
    [new File(['plain text'], 'resume.txt', { type: 'text/plain' }), 'resume_type_invalid'],
    [validPdf({ name: 'resume.pdf', type: 'application/msword' }), 'resume_type_invalid'],
    [new File(['not a pdf'], 'resume.pdf', { type: 'application/pdf' }), 'resume_content_invalid'],
  ];
  for (const [file, code] of cases) {
    await assert.rejects(
      () => validateServerApplicationFormData(validFormData({}, file)),
      (error) => error instanceof ApplicationValidationError && error.code === code,
    );
  }
});

test('missing, invalid, and expired reCAPTCHA all fail before Graph', async () => {
  for (const [token, recaptchaCode] of [
    ['', 'missing_token'],
    ['bad-token', 'rejected'],
    ['expired-token', 'expired_or_duplicate'],
  ]) {
    let graphCalls = 0;
    const response = await handler({
      verifyRecaptchaFn: async () => { throw new RecaptchaError(recaptchaCode); },
      sendApplicationEmailFn: async () => { graphCalls += 1; },
    })(request(validFormData({ recaptchaToken: token })), context());
    assert.equal(response.status, 400);
    assert.equal(response.jsonBody.error.code, 'verification_failed');
    assert.equal(graphCalls, 0);
  }
});

test('file or payload validation failure never calls reCAPTCHA or Graph', async () => {
  let verificationCalls = 0;
  let graphCalls = 0;
  const response = await handler({
    verifyRecaptchaFn: async () => { verificationCalls += 1; },
    sendApplicationEmailFn: async () => { graphCalls += 1; },
  })(request(validFormData({}, new File(['bad'], 'malware.exe', { type: 'application/x-msdownload' }))), context());
  assert.equal(response.status, 400);
  assert.equal(verificationCalls, 0);
  assert.equal(graphCalls, 0);
});

test('valid verified application calls Graph once and returns the approved message', async () => {
  let received;
  const response = await handler({
    sendApplicationEmailFn: async (input) => { received = input; },
  })(request(), context());
  assert.equal(response.status, 202);
  assert.equal(received.config.serverApplicationRecipientEmail, 'hiring@example.com');
  assert.match(response.jsonBody.message, /received for review/);
});

test('application endpoint applies its server-side rate limit before parsing or Graph', async () => {
  let graphCalls = 0;
  const response = await handler({
    rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 60 }) },
    sendApplicationEmailFn: async () => { graphCalls += 1; },
  })(request(), context());
  assert.equal(response.status, 429);
  assert.equal(response.jsonBody.error.code, 'rate_limited');
  assert.equal(graphCalls, 0);
});

test('application endpoint rejects unsupported and oversized multipart requests', async () => {
  const unsupported = await handler()(request(validFormData(), { contentType: 'application/json' }), context());
  assert.equal(unsupported.status, 415);
  const oversized = await handler()(request(validFormData(), { contentLength: String(7 * 1024 * 1024) }), context());
  assert.equal(oversized.status, 413);
});

test('duplicate applications are rejected and Graph failures release a pending claim', async () => {
  let released = false;
  let graphCalls = 0;
  const duplicateResponse = await handler({
    duplicateGuard: { claim: () => false, release() {}, complete() {} },
    sendApplicationEmailFn: async () => { graphCalls += 1; },
  })(request(), context());
  assert.equal(duplicateResponse.status, 400);
  assert.equal(graphCalls, 0);

  const failedResponse = await handler({
    duplicateGuard: { claim: () => true, release: () => { released = true; }, complete() {} },
    sendApplicationEmailFn: async () => { throw new GraphMailError('request_failed', 500); },
  })(request(), context());
  assert.equal(failedResponse.status, 502);
  assert.equal(released, true);
  assert.equal(failedResponse.jsonBody.error.code, 'delivery_failed');
});

test('recipient is loaded only from server configuration and sender remains fixed', () => {
  const environment = {
    AZURE_TENANT_ID: 'tenant',
    AZURE_CLIENT_ID: 'client',
    AZURE_CLIENT_SECRET: 'secret',
    GRAPH_SENDER_EMAIL: 'donotreply@diamondpeo.com',
    INQUIRY_RECIPIENT_EMAIL: 'beatriz@diamondpeo.com',
    SERVER_APPLICATION_RECIPIENT_EMAIL: 'Hiring@Example.com',
    RECAPTCHA_SECRET_KEY: 'recaptcha-secret',
    ALLOWED_RECAPTCHA_HOSTNAMES: '',
    ADDITIONAL_ALLOWED_ORIGINS: '',
  };
  const loaded = loadServerApplicationConfig(environment);
  assert.equal(loaded.graphSenderEmail, 'donotreply@diamondpeo.com');
  assert.equal(loaded.serverApplicationRecipientEmail, 'hiring@example.com');
  assert.throws(
    () => loadServerApplicationConfig({ ...environment, SERVER_APPLICATION_RECIPIENT_EMAIL: '' }),
    /not configured/i,
  );
});

test('email content escapes applicant HTML-like text and includes privacy footer', async () => {
  const application = await validateServerApplicationFormData(validFormData({
    schoolName: 'Tea & Service Academy',
  }));
  const content = buildServerApplicationEmail(application, {
    submittedAt: '2026-08-05T18:30:00.000Z',
    requestId: 'application-request-id',
  });
  assert.match(content.html, /Tea &amp; Service Academy/);
  assert.match(content.html, /Privacy and Confidentiality Notice/);
  assert.match(content.plainText, /WEEKLY AVAILABILITY/);
  assert.doesNotMatch(content.html, /href="https:\/\/diamonddevelopmentteam/);
});

test('Graph payload includes a fixed fileAttachment for a valid PDF and supports no attachment', async () => {
  const withResume = await validateServerApplicationFormData(validFormData({}, validPdf()));
  const options = {
    recipientEmail: 'hiring@example.com',
    submittedAt: '2026-08-05T18:30:00.000Z',
    requestId: 'application-request-id',
  };
  const attachmentPayload = buildServerApplicationGraphPayload(withResume, options);
  assert.equal(attachmentPayload.message.attachments[0]['@odata.type'], '#microsoft.graph.fileAttachment');
  assert.equal(attachmentPayload.message.attachments[0].contentType, 'application/pdf');
  assert.match(Buffer.from(attachmentPayload.message.attachments[0].contentBytes, 'base64').toString('ascii'), /^%PDF-/);
  assert.equal(attachmentPayload.message.toRecipients[0].emailAddress.address, 'hiring@example.com');
  assert.equal(attachmentPayload.message.replyTo[0].emailAddress.address, 'avery@example.com');

  const withoutResume = await validateServerApplicationFormData(validFormData());
  const noAttachmentPayload = buildServerApplicationGraphPayload(withoutResume, options);
  assert.equal('attachments' in noAttachmentPayload.message, false);
  withResume.resume.bytes.fill(0);
});

test('Graph submission uses the configured sender endpoint and returns a safe failure', async () => {
  const application = await validateServerApplicationFormData(validFormData());
  let requestDetails;
  await sendServerApplicationEmail({
    application,
    config,
    submittedAt: '2026-08-05T18:30:00.000Z',
    requestId: 'application-request-id',
    credentialFactory: () => ({ getToken: async () => ({ token: 'access-token' }) }),
    fetchImpl: async (url, options) => {
      requestDetails = { url, options };
      return { ok: true };
    },
  });
  assert.match(requestDetails.url, /users\/donotreply%40diamondpeo\.com\/sendMail$/);
  assert.equal(requestDetails.options.headers['Content-Type'], 'application/json');

  await assert.rejects(
    () => sendServerApplicationEmail({
      application,
      config,
      submittedAt: '2026-08-05T18:30:00.000Z',
      requestId: 'application-request-id',
      credentialFactory: () => ({ getToken: async () => ({ token: 'access-token' }) }),
      fetchImpl: async () => ({ ok: false, status: 500 }),
    }),
    (error) => error instanceof GraphMailError && error.status === 500,
  );
});

test('logs omit tokens, résumé bytes, and applicant content', async () => {
  const logs = [];
  const response = await handler()(request(validFormData({}, validPdf())), context(logs));
  assert.equal(response.status, 202);
  const joined = logs.join('\n');
  assert.doesNotMatch(joined, /verified-browser-token|Avery Applicant|%PDF-|contentBytes/);
  assert.match(joined, /resume_attached=true/);
});
