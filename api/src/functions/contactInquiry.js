import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import { ConfigurationError, loadConfig } from '../lib/config.js';
import { corsHeaders, isOriginAllowed } from '../lib/cors.js';
import { sendInquiryEmail } from '../lib/graphMail.js';
import { RecaptchaError, verifyRecaptcha } from '../lib/recaptcha.js';
import { ValidationError, validateContactInquiry } from '../lib/validation.js';

const MAX_BODY_BYTES = 16 * 1024;

function jsonResponse(status, body, headers, requestId) {
  return {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-ID': requestId,
    },
    jsonBody: body,
  };
}

function safeLog(context, level, requestId, code) {
  const logger = typeof context?.[level] === 'function' ? context[level].bind(context) : null;
  logger?.(`[${requestId}] Contact inquiry ${code}.`);
}

async function readJsonBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    throw new ValidationError('unsupported_content_type');
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new ValidationError('body_too_large');
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    throw new ValidationError('body_too_large');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new ValidationError('invalid_json');
  }
}

export function createContactInquiryHandler({
  configProvider = loadConfig,
  verifyRecaptchaFn = verifyRecaptcha,
  sendInquiryEmailFn = sendInquiryEmail,
  now = () => new Date().toISOString(),
  requestIdFactory = randomUUID,
} = {}) {
  return async function contactInquiry(request, context) {
    const requestId = requestIdFactory();
    const origin = request.headers.get('origin') || '';
    let config;

    try {
      config = configProvider();
    } catch (error) {
      const code = error instanceof ConfigurationError
        ? 'configuration_error'
        : 'configuration_load_failed';
      safeLog(context, 'error', requestId, code);
      return jsonResponse(
        503,
        { message: 'The contact service is temporarily unavailable.' },
        { Vary: 'Origin' },
        requestId,
      );
    }

    const responseCorsHeaders = corsHeaders(origin, config.allowedOrigins);
    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      safeLog(context, 'warn', requestId, 'origin_rejected');
      return jsonResponse(
        403,
        { message: 'This request is not allowed.' },
        responseCorsHeaders,
        requestId,
      );
    }

    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: {
          ...responseCorsHeaders,
          'X-Request-ID': requestId,
        },
      };
    }

    try {
      const body = await readJsonBody(request);
      const inquiry = validateContactInquiry(body);

      await verifyRecaptchaFn({
        token: inquiry.recaptchaToken,
        secret: config.recaptchaSecretKey,
        allowedHostnames: config.allowedRecaptchaHostnames,
      });

      await sendInquiryEmailFn({
        inquiry,
        config,
        submittedAt: now(),
        requestId,
      });

      safeLog(context, 'log', requestId, 'sent');
      return jsonResponse(
        202,
        { message: 'Thank you. Your message has been sent.', requestId },
        responseCorsHeaders,
        requestId,
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        safeLog(context, 'warn', requestId, 'validation_rejected');
        return jsonResponse(
          error.code === 'unsupported_content_type' ? 415 : error.code === 'body_too_large' ? 413 : 400,
          { message: 'Please check your submission and try again.', requestId },
          responseCorsHeaders,
          requestId,
        );
      }

      if (error instanceof RecaptchaError) {
        safeLog(context, 'warn', requestId, 'recaptcha_rejected');
        return jsonResponse(
          400,
          { message: 'We could not verify your submission. Please try again.', requestId },
          responseCorsHeaders,
          requestId,
        );
      }

      safeLog(context, 'error', requestId, 'delivery_failed');
      return jsonResponse(
        502,
        { message: 'We could not send your message. Please try again later.', requestId },
        responseCorsHeaders,
        requestId,
      );
    }
  };
}

export const contactInquiry = createContactInquiryHandler();

app.http('contactInquiry', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'inquiries/contact',
  handler: contactInquiry,
});
