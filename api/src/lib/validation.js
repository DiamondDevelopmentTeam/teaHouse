export const ALLOWED_TOPICS = Object.freeze([
  'General question',
  'Large party',
  'Private event',
  'Catering',
  'Media inquiry',
]);

export class ValidationError extends Error {
  constructor(code) {
    super('The request is invalid.');
    this.name = 'ValidationError';
    this.code = code;
  }
}

function normalizeText(value, field, { required = false, maximum }) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${field}_required`);
    return '';
  }

  if (typeof value !== 'string') throw new ValidationError(`${field}_invalid`);

  const normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  if (required && normalized === '') throw new ValidationError(`${field}_required`);
  if (normalized.length > maximum) throw new ValidationError(`${field}_too_long`);
  return normalized;
}

export function validateContactInquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('body_invalid');
  }

  const website = normalizeText(body.website, 'website', { maximum: 200 });
  if (website !== '') throw new ValidationError('honeypot');

  const name = normalizeText(body.name, 'name', { required: true, maximum: 120 });
  const email = normalizeText(body.email, 'email', { required: true, maximum: 254 });
  const phone = normalizeText(body.phone, 'phone', { maximum: 40 });
  const topic = normalizeText(body.topic, 'topic', { required: true, maximum: 80 });
  const message = normalizeText(body.message, 'message', { required: true, maximum: 5000 });
  const recaptchaToken = normalizeText(body.recaptchaToken, 'recaptchaToken', {
    required: true,
    maximum: 4096,
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('email_invalid');
  }

  if (!ALLOWED_TOPICS.includes(topic)) {
    throw new ValidationError('topic_invalid');
  }

  return { name, email, phone, topic, message, recaptchaToken };
}

