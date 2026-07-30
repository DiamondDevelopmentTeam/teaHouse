const REQUIRED_SETTINGS = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'GRAPH_SENDER_EMAIL',
  'INQUIRY_RECIPIENT_EMAIL',
];

export const INQUIRY_RECIPIENT_EMAIL = 'ashley@1890teahouse.com';
export const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  'https://diamonddevelopmentteam.github.io',
  'http://localhost:5173',
  'http://localhost:5174',
]);

export class ConfigurationError extends Error {
  constructor(missingSettings) {
    super('The contact service is not configured.');
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

  const graphSenderEmail = environment.GRAPH_SENDER_EMAIL.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(graphSenderEmail)) {
    throw new ConfigurationError(['GRAPH_SENDER_EMAIL']);
  }

  const recaptchaSecretKey = String(environment.RECAPTCHA_SECRET_KEY || '').trim();
  const allowedRecaptchaHostnames = parseList(environment.ALLOWED_RECAPTCHA_HOSTNAMES)
    .map((hostname) => hostname.toLowerCase());
  if (Boolean(recaptchaSecretKey) !== (allowedRecaptchaHostnames.length > 0)) {
    throw new ConfigurationError([
      recaptchaSecretKey ? 'ALLOWED_RECAPTCHA_HOSTNAMES' : 'RECAPTCHA_SECRET_KEY',
    ]);
  }

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
