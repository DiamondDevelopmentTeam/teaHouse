const REQUIRED_SETTINGS = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'GRAPH_SENDER_EMAIL',
  'INQUIRY_RECIPIENT_EMAIL',
  'RECAPTCHA_SECRET_KEY',
  'ALLOWED_ORIGINS',
  'ALLOWED_RECAPTCHA_HOSTNAMES',
];

export const INQUIRY_RECIPIENT_EMAIL = 'beatriz@diamondpeo.com';

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

  return {
    tenantId: environment.AZURE_TENANT_ID.trim(),
    clientId: environment.AZURE_CLIENT_ID.trim(),
    clientSecret: environment.AZURE_CLIENT_SECRET,
    graphSenderEmail,
    inquiryRecipientEmail: INQUIRY_RECIPIENT_EMAIL,
    recaptchaSecretKey: environment.RECAPTCHA_SECRET_KEY,
    allowedOrigins: parseList(environment.ALLOWED_ORIGINS),
    allowedRecaptchaHostnames: parseList(environment.ALLOWED_RECAPTCHA_HOSTNAMES).map(
      (hostname) => hostname.toLowerCase(),
    ),
  };
}
