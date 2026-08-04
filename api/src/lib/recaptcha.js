const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export class RecaptchaError extends Error {
  constructor(code) {
    super('The reCAPTCHA verification failed.');
    this.name = 'RecaptchaError';
    this.code = code;
  }
}

export async function verifyRecaptcha({
  token,
  secret,
  allowedHostnames,
  fetchImpl = fetch,
}) {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new RecaptchaError('missing_token');
  }
  if (typeof secret !== 'string' || secret.trim() === '') {
    throw new RecaptchaError('unavailable');
  }

  const body = new URLSearchParams({ secret, response: token });
  let response;

  try {
    response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new RecaptchaError('unavailable');
  }

  if (!response.ok) throw new RecaptchaError('unavailable');

  let result;
  try {
    result = await response.json();
  } catch {
    throw new RecaptchaError('invalid_response');
  }

  if (result.success !== true) {
    const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
    if (errorCodes.includes('timeout-or-duplicate')) {
      throw new RecaptchaError('expired_or_duplicate');
    }
    if (errorCodes.some((code) => [
      'missing-input-response',
      'invalid-input-response',
      'bad-request',
    ].includes(code))) {
      throw new RecaptchaError('malformed_token');
    }
    throw new RecaptchaError('rejected');
  }

  const hostname = typeof result.hostname === 'string' ? result.hostname.toLowerCase() : '';
  if (!hostname || !allowedHostnames.includes(hostname)) {
    throw new RecaptchaError('invalid_hostname');
  }

  return { hostname };
}
