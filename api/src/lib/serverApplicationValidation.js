const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const APPLICATION_DAYS = Object.freeze([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);

export const EXPERIENCE_OPTIONS = Object.freeze([
  'Customer service experience',
  'Food and beverage handling',
  'POS or cash register experience',
  'Ability to work in fast-paced environments',
  'Comfort carrying trays and standing for extended periods',
]);

const DESIRED_EMPLOYMENT = Object.freeze(['Full-time', 'Part-time', 'Either']);
const YES_NO = Object.freeze(['Yes', 'No']);
const EDUCATION_LEVELS = Object.freeze([
  'High school',
  'GED',
  'Some college',
  'Associate degree',
  "Bachelor's degree",
  'Graduate degree',
  'Other',
]);

const RESUME_TYPES = Object.freeze({
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

const SINGLE_FIELDS = Object.freeze([
  'position',
  'applicationDate',
  'availableStartDate',
  'desiredEmployment',
  'availability',
  'availableWeekends',
  'availableHolidays',
  'firstName',
  'lastName',
  'phone',
  'email',
  'streetAddress',
  'city',
  'state',
  'zipCode',
  'isAdult',
  'workAuthorized',
  'whyWorkHere',
  'certifications',
  'educationLevel',
  'schoolName',
  'reference1Name',
  'reference1Phone',
  'reference1Relationship',
  'reference2Name',
  'reference2Phone',
  'reference2Relationship',
  'backgroundCheck',
  'certification',
  'signatureName',
  'signatureDate',
  'pageUrl',
  'recaptchaToken',
  'website',
  'resume',
]);

const ALLOWED_FIELDS = new Set([...SINGLE_FIELDS, 'experience']);

export class ApplicationValidationError extends Error {
  constructor(code, field = code.split('_', 1)[0]) {
    super('The server application is invalid.');
    this.name = 'ApplicationValidationError';
    this.code = code;
    this.field = field;
  }
}

function normalizeText(value, field, { required = false, maximum, multiline = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ApplicationValidationError(`${field}_required`, field);
    return '';
  }
  if (typeof value !== 'string') {
    throw new ApplicationValidationError(`${field}_invalid`, field);
  }

  let normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (!multiline) normalized = normalized.replace(/\s*\n+\s*/g, ' ');
  if (required && !normalized) {
    throw new ApplicationValidationError(`${field}_required`, field);
  }
  if (normalized.length > maximum) {
    throw new ApplicationValidationError(`${field}_too_long`, field);
  }
  return normalized;
}

function rejectMarkupOrLinks(value, field) {
  if (
    /<\s*\/?\s*[a-z][^>]*>/i.test(value)
    || /(?:https?:\/\/|www\.|javascript:|data:text\/html)/i.test(value)
    || /\[[^\]]+\]\([^)]+\)/.test(value)
  ) {
    throw new ApplicationValidationError(`${field}_disallowed_content`, field);
  }
  return value;
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

function requireChoice(value, field, choices) {
  const normalized = normalizeText(value, field, { required: true, maximum: 80 });
  if (!choices.includes(normalized)) {
    throw new ApplicationValidationError(`${field}_invalid`, field);
  }
  return normalized;
}

function validateAvailability(value) {
  const serialized = normalizeText(value, 'availability', { required: true, maximum: 2500 });
  let entries;
  try {
    entries = JSON.parse(serialized);
  } catch {
    throw new ApplicationValidationError('availability_invalid', 'availability');
  }
  if (!Array.isArray(entries) || entries.length !== APPLICATION_DAYS.length) {
    throw new ApplicationValidationError('availability_invalid', 'availability');
  }

  const days = new Set();
  const normalized = entries.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ApplicationValidationError('availability_invalid', 'availability');
    }
    const keys = Object.keys(entry).sort();
    if (keys.join(',') !== 'available,day,earliest,latest') {
      throw new ApplicationValidationError('availability_invalid', 'availability');
    }
    const day = normalizeText(entry.day, 'availability', { required: true, maximum: 12 });
    if (!APPLICATION_DAYS.includes(day) || days.has(day) || typeof entry.available !== 'boolean') {
      throw new ApplicationValidationError('availability_invalid', 'availability');
    }
    days.add(day);
    const earliest = normalizeText(entry.earliest, 'availability', { maximum: 5 });
    const latest = normalizeText(entry.latest, 'availability', { maximum: 5 });
    if (entry.available) {
      if (!validTime(earliest) || !validTime(latest) || timeMinutes(earliest) >= timeMinutes(latest)) {
        throw new ApplicationValidationError('availability_range_invalid', 'availability');
      }
    } else if (earliest || latest) {
      throw new ApplicationValidationError('availability_invalid', 'availability');
    }
    return { day, available: entry.available, earliest, latest };
  });

  if (normalized.every(({ available }) => !available)) {
    throw new ApplicationValidationError('availability_required', 'availability');
  }
  return normalized.sort((a, b) => APPLICATION_DAYS.indexOf(a.day) - APPLICATION_DAYS.indexOf(b.day));
}

function validateExperiences(formData) {
  const values = formData.getAll('experience');
  if (values.length > EXPERIENCE_OPTIONS.length || values.some((value) => typeof value !== 'string')) {
    throw new ApplicationValidationError('experience_invalid', 'experience');
  }
  const normalized = values.map((value) => normalizeText(value, 'experience', {
    required: true,
    maximum: 90,
  }));
  if (
    new Set(normalized).size !== normalized.length
    || normalized.some((value) => !EXPERIENCE_OPTIONS.includes(value))
  ) {
    throw new ApplicationValidationError('experience_invalid', 'experience');
  }
  return normalized;
}

function sanitizeFilename(value) {
  const original = String(value || '');
  if (original.includes('\u0000')) {
    throw new ApplicationValidationError('resume_filename_invalid', 'resume');
  }
  const filename = original
    .replaceAll('\\', '/')
    .split('/')
    .pop()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[^a-zA-Z0-9._ -]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  if (!filename || filename === '.' || filename === '..') {
    throw new ApplicationValidationError('resume_filename_invalid', 'resume');
  }
  return filename;
}

function fileExtension(filename) {
  const index = filename.lastIndexOf('.');
  return index < 0 ? '' : filename.slice(index).toLowerCase();
}

function hasExpectedSignature(bytes, extension) {
  if (extension === '.pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (extension === '.doc') {
    return bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }
  if (extension === '.docx') {
    const zipSignature = bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    const archiveIndex = bytes.toString('latin1');
    return zipSignature
      && archiveIndex.includes('[Content_Types].xml')
      && archiveIndex.includes('word/document.xml');
  }
  return false;
}

async function validateResume(file) {
  if (!file || (typeof file === 'string' && file === '')) return null;
  if (
    typeof file !== 'object'
    || typeof file.arrayBuffer !== 'function'
    || typeof file.name !== 'string'
    || typeof file.type !== 'string'
    || typeof file.size !== 'number'
  ) {
    throw new ApplicationValidationError('resume_invalid', 'resume');
  }
  if (file.size === 0 && file.name === '') return null;
  if (file.size <= 0) throw new ApplicationValidationError('resume_empty', 'resume');
  if (file.size > MAX_RESUME_BYTES) {
    throw new ApplicationValidationError('resume_too_large', 'resume');
  }

  const filename = sanitizeFilename(file.name);
  const extension = fileExtension(filename);
  const expectedType = RESUME_TYPES[extension];
  if (!expectedType || file.type.toLowerCase() !== expectedType) {
    throw new ApplicationValidationError('resume_type_invalid', 'resume');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length !== file.size || !hasExpectedSignature(bytes, extension)) {
    bytes.fill(0);
    throw new ApplicationValidationError('resume_content_invalid', 'resume');
  }
  return { filename, contentType: expectedType, bytes };
}

function getSingle(formData, field) {
  const values = formData.getAll(field);
  if (values.length > 1) throw new ApplicationValidationError(`${field}_duplicate`, field);
  return values[0];
}

function reference(formData, number) {
  return {
    name: rejectMarkupOrLinks(normalizeText(getSingle(formData, `reference${number}Name`), `reference${number}Name`, { required: true, maximum: 120 }), `reference${number}Name`),
    phone: normalizeText(getSingle(formData, `reference${number}Phone`), `reference${number}Phone`, { required: true, maximum: 40 }),
    relationship: rejectMarkupOrLinks(normalizeText(getSingle(formData, `reference${number}Relationship`), `reference${number}Relationship`, { required: true, maximum: 80 }), `reference${number}Relationship`),
  };
}

export async function validateServerApplicationFormData(formData) {
  if (!formData || typeof formData.entries !== 'function' || typeof formData.getAll !== 'function') {
    throw new ApplicationValidationError('body_invalid', 'form');
  }
  for (const [key] of formData.entries()) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new ApplicationValidationError('unexpected_field', key);
    }
  }

  const website = normalizeText(getSingle(formData, 'website'), 'website', { maximum: 200 });
  if (website) throw new ApplicationValidationError('honeypot', 'website');

  const position = requireChoice(getSingle(formData, 'position'), 'position', ['Server']);
  const applicationDate = normalizeText(getSingle(formData, 'applicationDate'), 'applicationDate', { required: true, maximum: 10 });
  const availableStartDate = normalizeText(getSingle(formData, 'availableStartDate'), 'availableStartDate', { required: true, maximum: 10 });
  if (!validIsoDate(applicationDate)) throw new ApplicationValidationError('applicationDate_invalid', 'applicationDate');
  if (!validIsoDate(availableStartDate) || availableStartDate < applicationDate) {
    throw new ApplicationValidationError('availableStartDate_invalid', 'availableStartDate');
  }

  const firstName = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'firstName'), 'firstName', { required: true, maximum: 80 }), 'firstName');
  const lastName = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'lastName'), 'lastName', { required: true, maximum: 80 }), 'lastName');
  const phone = normalizeText(getSingle(formData, 'phone'), 'phone', { required: true, maximum: 40 });
  const email = normalizeText(getSingle(formData, 'email'), 'email', { required: true, maximum: 254 });
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i.test(email)) {
    throw new ApplicationValidationError('email_invalid', 'email');
  }
  if (!/^[+()\-.\sx0-9]{7,40}$/i.test(phone) || phone.replace(/\D/g, '').length < 7) {
    throw new ApplicationValidationError('phone_invalid', 'phone');
  }

  const streetAddress = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'streetAddress'), 'streetAddress', { required: true, maximum: 160 }), 'streetAddress');
  const city = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'city'), 'city', { required: true, maximum: 80 }), 'city');
  const state = normalizeText(getSingle(formData, 'state'), 'state', { required: true, maximum: 2 }).toUpperCase();
  const zipCode = normalizeText(getSingle(formData, 'zipCode'), 'zipCode', { required: true, maximum: 10 });
  if (!/^[A-Z]{2}$/.test(state)) throw new ApplicationValidationError('state_invalid', 'state');
  if (!/^\d{5}(?:-\d{4})?$/.test(zipCode)) throw new ApplicationValidationError('zipCode_invalid', 'zipCode');

  const whyWorkHere = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'whyWorkHere'), 'whyWorkHere', { required: true, maximum: 1500, multiline: true }), 'whyWorkHere');
  const certifications = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'certifications'), 'certifications', { maximum: 500, multiline: true }), 'certifications');
  const schoolName = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'schoolName'), 'schoolName', { maximum: 120 }), 'schoolName');
  const backgroundCheck = requireChoice(getSingle(formData, 'backgroundCheck'), 'backgroundCheck', YES_NO);
  const signatureName = rejectMarkupOrLinks(normalizeText(getSingle(formData, 'signatureName'), 'signatureName', { required: true, maximum: 160 }), 'signatureName');
  const signatureDate = normalizeText(getSingle(formData, 'signatureDate'), 'signatureDate', { required: true, maximum: 10 });
  if (!validIsoDate(signatureDate)) throw new ApplicationValidationError('signatureDate_invalid', 'signatureDate');
  if (normalizeText(getSingle(formData, 'certification'), 'certification', { required: true, maximum: 5 }) !== 'true') {
    throw new ApplicationValidationError('certification_required', 'certification');
  }

  const pageUrl = normalizeText(getSingle(formData, 'pageUrl'), 'pageUrl', { required: true, maximum: 2048 });
  let parsedPageUrl;
  try {
    parsedPageUrl = new URL(pageUrl);
  } catch {
    throw new ApplicationValidationError('pageUrl_invalid', 'pageUrl');
  }
  if (!['http:', 'https:'].includes(parsedPageUrl.protocol)) {
    throw new ApplicationValidationError('pageUrl_invalid', 'pageUrl');
  }

  const recaptchaToken = normalizeText(getSingle(formData, 'recaptchaToken'), 'recaptchaToken', { maximum: 4096 });
  const references = [reference(formData, 1), reference(formData, 2)];
  for (const item of references) {
    if (!/^[+()\-.\sx0-9]{7,40}$/i.test(item.phone) || item.phone.replace(/\D/g, '').length < 7) {
      throw new ApplicationValidationError('referencePhone_invalid', 'references');
    }
  }

  const resume = await validateResume(getSingle(formData, 'resume'));

  return {
    position,
    applicationDate,
    availableStartDate,
    desiredEmployment: requireChoice(getSingle(formData, 'desiredEmployment'), 'desiredEmployment', DESIRED_EMPLOYMENT),
    availability: validateAvailability(getSingle(formData, 'availability')),
    availableWeekends: requireChoice(getSingle(formData, 'availableWeekends'), 'availableWeekends', YES_NO),
    availableHolidays: requireChoice(getSingle(formData, 'availableHolidays'), 'availableHolidays', YES_NO),
    firstName,
    lastName,
    phone,
    email,
    streetAddress,
    city,
    state,
    zipCode,
    isAdult: requireChoice(getSingle(formData, 'isAdult'), 'isAdult', YES_NO),
    workAuthorized: requireChoice(getSingle(formData, 'workAuthorized'), 'workAuthorized', YES_NO),
    experiences: validateExperiences(formData),
    whyWorkHere,
    certifications,
    educationLevel: requireChoice(getSingle(formData, 'educationLevel'), 'educationLevel', EDUCATION_LEVELS),
    schoolName,
    references,
    backgroundCheck,
    certification: true,
    signatureName,
    signatureDate,
    pageUrl: parsedPageUrl.href,
    recaptchaToken,
    resume,
  };
}

export const RESUME_MAX_BYTES = MAX_RESUME_BYTES;
