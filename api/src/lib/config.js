const REQUIRED_SETTINGS = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'GRAPH_SENDER_EMAIL',
  'INQUIRY_RECIPIENT_EMAIL',
  'RECAPTCHA_SECRET_KEY',
];

export const INQUIRY_RECIPIENT_EMAIL = 'beatriz@diamondpeo.com';
export const GRAPH_SENDER_EMAIL = 'donotreply@diamondpeo.com';
export const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  'https://diamonddevelopmentteam.github.io',
  'https://1890teahouse.com',
  'https://www.1890teahouse.com',
  'http://localhost:5173',
  'http://localhost:5174',
]);
export const DEFAULT_ALLOWED_RECAPTCHA_HOSTNAMES = Object.freeze([
  'localhost',
  'diamonddevelopmentteam.github.io',
  '1890teahouse.com',
  'www.1890teahouse.com',
]);

export class ConfigurationError extends Error {
  constructor(missingSettings) {
    super('The form submission service is not configured.');
    this.name = 'ConfigurationError';
    this.missingSettings = missingSettings;
  }
}

export function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOrigin(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function parseHostname(value) {
  const hostname = String(value || '').toLowerCase();
  if (hostname === 'localhost') return hostname;
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)) {
    return null;
  }
  return hostname;
}

export function loadAllowedOrigins(environment = process.env) {
  const additionalOrigins = parseList(environment.ADDITIONAL_ALLOWED_ORIGINS);
  const invalidOrigins = additionalOrigins.filter((origin) => !parseOrigin(origin));
  if (invalidOrigins.length > 0) {
    throw new ConfigurationError(['ADDITIONAL_ALLOWED_ORIGINS']);
  }

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...additionalOrigins])];
}

export function loadConfig(environment = process.env) {
  const missingSettings = REQUIRED_SETTINGS.filter(
    (name) => typeof environment[name] !== 'string' || environment[name].trim() === '',
  );

  if (missingSettings.length > 0) {
    throw new ConfigurationError(missingSettings);
  }

  const configuredRecipient = environment.INQUIRY_RECIPIENT_EMAIL.trim().toLowerCase();
  if (configuredRecipient !== INQUIRY_RECIPIENT_EMAIL) {
    throw new ConfigurationError(['INQUIRY_RECIPIENT_EMAIL']);
  }

  const graphSenderEmail = environment.GRAPH_SENDER_EMAIL.trim().toLowerCase();
  if (graphSenderEmail !== GRAPH_SENDER_EMAIL) {
    throw new ConfigurationError(['GRAPH_SENDER_EMAIL']);
  }

  const recaptchaSecretKey = environment.RECAPTCHA_SECRET_KEY.trim();
  const additionalRecaptchaHostnames = parseList(environment.ALLOWED_RECAPTCHA_HOSTNAMES)
    .map((hostname) => hostname.toLowerCase());
  if (additionalRecaptchaHostnames.some((hostname) => !parseHostname(hostname))) {
    throw new ConfigurationError(['ALLOWED_RECAPTCHA_HOSTNAMES']);
  }
  const allowedRecaptchaHostnames = [
    ...new Set([
      ...DEFAULT_ALLOWED_RECAPTCHA_HOSTNAMES,
      ...additionalRecaptchaHostnames,
    ]),
  ];

  return {
    tenantId: environment.AZURE_TENANT_ID.trim(),
    clientId: environment.AZURE_CLIENT_ID.trim(),
    clientSecret: environment.AZURE_CLIENT_SECRET,
    graphSenderEmail,
    inquiryRecipientEmail: INQUIRY_RECIPIENT_EMAIL,
    recaptchaSecretKey,
    allowedOrigins: loadAllowedOrigins(environment),
    allowedRecaptchaHostnames,
  };
}
