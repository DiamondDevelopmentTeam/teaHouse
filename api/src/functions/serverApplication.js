import { createHash, randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import {
  ConfigurationError,
  DEFAULT_ALLOWED_ORIGINS,
  loadServerApplicationConfig,
} from '../lib/config.js';
import { corsHeaders, isOriginAllowed } from '../lib/cors.js';
import { GraphMailError } from '../lib/graphMail.js';
import {
  requestClientKey,
  serverApplicationDuplicateGuard,
  serverApplicationRateLimiter,
} from '../lib/rateLimit.js';
import { RecaptchaError, verifyRecaptcha } from '../lib/recaptcha.js';
import { sendServerApplicationEmail } from '../lib/serverApplicationMail.js';
import {
  ApplicationValidationError,
  validateServerApplicationFormData,
} from '../lib/serverApplicationValidation.js';

const MAX_MULTIPART_BYTES = 6 * 1024 * 1024;

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

function errorBody(code, message, requestId, field = '') {
  return {
    ok: false,
    error: { code, message, ...(field ? { field } : {}) },
    message,
    requestId,
  };
}

function safeLog(context, level, requestId, code, detail = '') {
  const logger = typeof context?.[level] === 'function' ? context[level].bind(context) : null;
  logger?.(`[${requestId}] Server application ${code}${detail ? ` (${detail})` : ''}.`);
}

async function readMultipart(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !/boundary=/i.test(contentType)) {
    throw new ApplicationValidationError('unsupported_content_type', 'form');
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    throw new ApplicationValidationError('body_too_large', 'resume');
  }
  try {
    return await request.formData();
  } catch {
    throw new ApplicationValidationError('invalid_multipart', 'form');
  }
}

function duplicateKey(clientKey, application) {
  return createHash('sha256')
    .update([
      'server-application',
      clientKey,
      application.email.toLowerCase(),
      application.phone,
      application.applicationDate,
      application.signatureName.toLowerCase(),
    ].join('|'))
    .digest('hex');
}

export function createServerApplicationHandler({
  configProvider = loadServerApplicationConfig,
  verifyRecaptchaFn = verifyRecaptcha,
  sendApplicationEmailFn = sendServerApplicationEmail,
  validateApplicationFn = validateServerApplicationFormData,
  rateLimiter = serverApplicationRateLimiter,
  duplicateGuard = serverApplicationDuplicateGuard,
  now = () => new Date().toISOString(),
  requestIdFactory = randomUUID,
} = {}) {
  return async function serverApplication(request, context) {
    const requestId = requestIdFactory();
    const origin = request.headers.get('origin') || '';
    let config;
    try {
      config = configProvider();
    } catch (error) {
      const code = error instanceof ConfigurationError
        ? 'configuration_error'
        : 'configuration_load_failed';
      const detail = error instanceof ConfigurationError
        ? `settings=${error.missingSettings.join(',')}`
        : '';
      safeLog(context, 'error', requestId, code, detail);
      return jsonResponse(
        503,
        errorBody('service_unavailable', 'The application service is temporarily unavailable.', requestId),
        corsHeaders(origin, DEFAULT_ALLOWED_ORIGINS),
        requestId,
      );
    }

    const responseCorsHeaders = corsHeaders(origin, config.allowedOrigins);
    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      safeLog(context, 'warn', requestId, 'origin_rejected');
      return jsonResponse(403, errorBody('origin_not_allowed', 'This request is not allowed.', requestId), responseCorsHeaders, requestId);
    }
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: { ...responseCorsHeaders, 'X-Request-ID': requestId } };
    }

    const clientKey = requestClientKey(request);
    const rateLimit = rateLimiter.check(`server-application:${clientKey}`);
    if (!rateLimit.allowed) {
      safeLog(context, 'warn', requestId, 'rate_limited');
      return jsonResponse(
        429,
        errorBody('rate_limited', 'Your application could not be submitted right now. Please wait and try again.', requestId),
        { ...responseCorsHeaders, 'Retry-After': String(rateLimit.retryAfterSeconds) },
        requestId,
      );
    }

    let application;
    let fingerprint = '';
    let duplicateClaimed = false;
    try {
      const formData = await readMultipart(request);
      application = await validateApplicationFn(formData);
      if (!application.recaptchaToken) throw new RecaptchaError('missing_token');
      await verifyRecaptchaFn({
        token: application.recaptchaToken,
        secret: config.recaptchaSecretKey,
        allowedHostnames: config.allowedRecaptchaHostnames,
      });

      fingerprint = duplicateKey(clientKey, application);
      duplicateClaimed = duplicateGuard.claim(fingerprint);
      if (!duplicateClaimed) {
        throw new ApplicationValidationError('duplicate_submission', 'form');
      }

      await sendApplicationEmailFn({
        application,
        config,
        submittedAt: now(),
        requestId,
      });
      duplicateGuard.complete(fingerprint);

      safeLog(context, 'log', requestId, 'sent', `resume_attached=${Boolean(application.resume)}`);
      return jsonResponse(
        202,
        {
          ok: true,
          message: 'Thank you. Your application has been received for review. If the Tea House would like to continue the process, a team member will contact you using the information provided.',
          requestId,
        },
        responseCorsHeaders,
        requestId,
      );
    } catch (error) {
      if (duplicateClaimed && fingerprint) duplicateGuard.release(fingerprint);
      if (error instanceof ApplicationValidationError) {
        safeLog(context, 'warn', requestId, `validation_${error.code}`);
        const status = error.code === 'unsupported_content_type'
          ? 415
          : ['body_too_large', 'resume_too_large'].includes(error.code) ? 413 : 400;
        return jsonResponse(
          status,
          errorBody('validation_failed', 'Please check the highlighted application information and try again.', requestId, error.field),
          responseCorsHeaders,
          requestId,
        );
      }
      if (error instanceof RecaptchaError) {
        safeLog(context, 'warn', requestId, `recaptcha_${error.code}`);
        return jsonResponse(
          400,
          errorBody('verification_failed', 'Human verification was not accepted. Please complete it again.', requestId, 'recaptchaToken'),
          responseCorsHeaders,
          requestId,
        );
      }
      const code = error instanceof GraphMailError ? `delivery_${error.code}` : 'delivery_failed';
      const detail = error instanceof GraphMailError && error.status ? `graph_status=${error.status}` : '';
      safeLog(context, 'error', requestId, code, detail);
      return jsonResponse(
        502,
        errorBody('delivery_failed', 'We could not submit your application. Please try again later.', requestId),
        responseCorsHeaders,
        requestId,
      );
    } finally {
      application?.resume?.bytes?.fill(0);
    }
  };
}

export const serverApplication = createServerApplicationHandler();

app.http('sendServerApplication', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'send-server-application',
  handler: serverApplication,
});
