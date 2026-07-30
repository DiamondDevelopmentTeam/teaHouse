import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import {
  ConfigurationError,
  DEFAULT_ALLOWED_ORIGINS,
  loadConfig,
} from '../lib/config.js';
import { corsHeaders, isOriginAllowed } from '../lib/cors.js';
import { GraphMailError, sendInquiryEmail } from '../lib/graphMail.js';
import {
  inquiryRateLimiter,
  requestClientKey,
} from '../lib/rateLimit.js';
import { RecaptchaError, verifyRecaptcha } from '../lib/recaptcha.js';
import {
  ValidationError,
  validateInquirySubmission,
} from '../lib/validation.js';

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

function safeLog(context, level, requestId, code, detail = '') {
  const logger = typeof context?.[level] === 'function' ? context[level].bind(context) : null;
  logger?.(`[${requestId}] Form submission ${code}${detail ? ` (${detail})` : ''}.`);
}

function errorBody(code, message, requestId) {
  return {
    ok: false,
    error: { code, message },
    message,
    requestId,
  };
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
  rateLimiter = inquiryRateLimiter,
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
      const missing = error instanceof ConfigurationError
        ? `settings=${error.missingSettings.join(',')}`
        : '';
      safeLog(context, 'error', requestId, code, missing);
      const responseCorsHeaders = corsHeaders(origin, DEFAULT_ALLOWED_ORIGINS);
      return jsonResponse(
        503,
        errorBody(
          'service_unavailable',
          'The submission service is temporarily unavailable.',
          requestId,
        ),
        responseCorsHeaders,
        requestId,
      );
    }

    const responseCorsHeaders = corsHeaders(origin, config.allowedOrigins);
    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      safeLog(context, 'warn', requestId, 'origin_rejected');
      return jsonResponse(
        403,
        errorBody('origin_not_allowed', 'This request is not allowed.', requestId),
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

    const rateLimit = rateLimiter.check(requestClientKey(request));
    if (!rateLimit.allowed) {
      safeLog(context, 'warn', requestId, 'rate_limited');
      return jsonResponse(
        429,
        errorBody(
          'rate_limited',
          'Too many requests were sent. Please wait and try again.',
          requestId,
        ),
        {
          ...responseCorsHeaders,
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
        requestId,
      );
    }

    try {
      const body = await readJsonBody(request);
      const inquiry = validateInquirySubmission(body);

      if (config.recaptchaSecretKey) {
        if (!inquiry.recaptchaToken) throw new RecaptchaError('missing');
        await verifyRecaptchaFn({
          token: inquiry.recaptchaToken,
          secret: config.recaptchaSecretKey,
          allowedHostnames: config.allowedRecaptchaHostnames,
        });
      }

      await sendInquiryEmailFn({
        inquiry,
        config,
        submittedAt: now(),
        requestId,
      });

      safeLog(context, 'log', requestId, 'sent', `form_type=${inquiry.formType}`);
      return jsonResponse(
        202,
        {
          ok: true,
          message: 'Thank you! Your request has been sent to the Tea House team.',
          requestId,
        },
        responseCorsHeaders,
        requestId,
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        safeLog(context, 'warn', requestId, `validation_${error.code}`);
        return jsonResponse(
          error.code === 'unsupported_content_type' ? 415 : error.code === 'body_too_large' ? 413 : 400,
          errorBody(
            'validation_failed',
            'Please check your submission and try again.',
            requestId,
          ),
          responseCorsHeaders,
          requestId,
        );
      }

      if (error instanceof RecaptchaError) {
        safeLog(context, 'warn', requestId, `recaptcha_${error.code}`);
        return jsonResponse(
          400,
          errorBody(
            'verification_failed',
            'We could not verify your submission. Please try again.',
            requestId,
          ),
          responseCorsHeaders,
          requestId,
        );
      }

      const deliveryCode = error instanceof GraphMailError
        ? `delivery_${error.code}`
        : 'delivery_failed';
      const deliveryDetail = error instanceof GraphMailError && error.status
        ? `graph_status=${error.status}`
        : '';
      safeLog(context, 'error', requestId, deliveryCode, deliveryDetail);
      return jsonResponse(
        502,
        errorBody(
          'delivery_failed',
          'We could not send your message. Please try again later.',
          requestId,
        ),
        responseCorsHeaders,
        requestId,
      );
    }
  };
}

export const contactInquiry = createContactInquiryHandler();

app.http('sendInquiry', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'send-inquiry',
  handler: contactInquiry,
});
