export const FORM_TYPES = Object.freeze([
  'general',
  'reservation',
  'event',
  'contact',
]);

export const ALLOWED_CATEGORIES = Object.freeze([
  'General question',
  'Large party',
  'Private event',
  'Catering',
  'Media inquiry',
  'Tea Room',
  'Wedding event',
  'Birthday',
  'Book club',
  'Business gathering',
  'Other',
]);

const ALLOWED_PREORDERS = Object.freeze([
  'Charcuterie boards',
  'Tea sandwiches',
  'Desserts',
  'Tea service for the table',
]);

export class ValidationError extends Error {
  constructor(code) {
    super('The request is invalid.');
    this.name = 'ValidationError';
    this.code = code;
  }
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function normalizeText(value, field, { required = false, maximum, multiline = false }) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${field}_required`);
    return '';
  }

  if (typeof value !== 'string') throw new ValidationError(`${field}_invalid`);

  let normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  if (!multiline) normalized = normalized.replace(/\s*\n+\s*/g, ' ');

  if (required && normalized === '') throw new ValidationError(`${field}_required`);
  if (normalized.length > maximum) throw new ValidationError(`${field}_too_long`);
  return normalized;
}

function normalizePreOrders(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > ALLOWED_PREORDERS.length) {
    throw new ValidationError('preOrders_invalid');
  }

  const preOrders = value.map((item) =>
    normalizeText(item, 'preOrders', { required: true, maximum: 80 }));
  if (new Set(preOrders).size !== preOrders.length) {
    throw new ValidationError('preOrders_invalid');
  }
  if (preOrders.some((item) => !ALLOWED_PREORDERS.includes(item))) {
    throw new ValidationError('preOrders_invalid');
  }
  return preOrders;
}

function normalizePolicyAgreement(value) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'boolean') throw new ValidationError('policyAgreement_invalid');
  return value;
}

export function validateInquirySubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('body_invalid');
  }

  const website = normalizeText(body.website, 'website', { maximum: 200 });
  if (website !== '') throw new ValidationError('honeypot');

  const formType = normalizeText(body.formType, 'formType', {
    required: true,
    maximum: 20,
  });
  const name = normalizeText(body.name, 'name', { required: true, maximum: 120 });
  const email = normalizeText(body.email, 'email', { required: true, maximum: 254 });
  const phone = normalizeText(body.phone, 'phone', {
    required: true,
    maximum: 40,
  });
  const preferredDate = normalizeText(body.preferredDate, 'preferredDate', {
    required: true,
    maximum: 10,
  });
  const preferredTime = normalizeText(body.preferredTime, 'preferredTime', {
    maximum: 5,
  });
  const guestCount = normalizeText(body.guestCount, 'guestCount', {
    required: true,
    maximum: 3,
  });
  const inquiryCategory = normalizeText(body.inquiryCategory, 'inquiryCategory', {
    required: true,
    maximum: 80,
  });
  const message = normalizeText(body.message, 'message', {
    required: true,
    maximum: 5000,
    multiline: true,
  });
  const pageUrl = normalizeText(body.pageUrl, 'pageUrl', {
    required: true,
    maximum: 2048,
  });
  const recaptchaToken = normalizeText(body.recaptchaToken, 'recaptchaToken', {
    maximum: 4096,
  });
  const preOrders = normalizePreOrders(body.preOrders);
  const policyAgreement = normalizePolicyAgreement(body.policyAgreement);

  if (!FORM_TYPES.includes(formType)) {
    throw new ValidationError('formType_invalid');
  }
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i.test(email)) {
    throw new ValidationError('email_invalid');
  }
  if (!/^[+()\-.\sx0-9]{7,40}$/i.test(phone) || phone.replace(/\D/g, '').length < 7) {
    throw new ValidationError('phone_invalid');
  }
  if (!isValidIsoDate(preferredDate)) {
    throw new ValidationError('preferredDate_invalid');
  }
  if (preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime)) {
    throw new ValidationError('preferredTime_invalid');
  }
  if (!/^[1-9]\d{0,2}$/.test(guestCount) || Number(guestCount) > 500) {
    throw new ValidationError('guestCount_invalid');
  }
  if (!ALLOWED_CATEGORIES.includes(inquiryCategory)) {
    throw new ValidationError('inquiryCategory_invalid');
  }
  if (formType === 'reservation' && !policyAgreement) {
    throw new ValidationError('policyAgreement_required');
  }

  let parsedPageUrl;
  try {
    parsedPageUrl = new URL(pageUrl);
  } catch {
    throw new ValidationError('pageUrl_invalid');
  }
  if (!['http:', 'https:'].includes(parsedPageUrl.protocol)) {
    throw new ValidationError('pageUrl_invalid');
  }

  return {
    formType,
    name,
    email,
    phone,
    preferredDate,
    preferredTime,
    guestCount,
    inquiryCategory,
    message,
    pageUrl: parsedPageUrl.href,
    preOrders,
    policyAgreement,
    recaptchaToken,
  };
}
