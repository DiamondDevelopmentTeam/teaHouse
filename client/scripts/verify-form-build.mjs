import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const endpoint = String(process.env.VITE_INQUIRY_API_URL || '').trim();
if (!endpoint) throw new Error('VITE_INQUIRY_API_URL is required.');
const applicationEndpoint = String(process.env.VITE_SERVER_APPLICATION_API_URL || '').trim();
if (!applicationEndpoint) throw new Error('VITE_SERVER_APPLICATION_API_URL is required.');
const recaptchaSiteKey = String(process.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
if (!recaptchaSiteKey) throw new Error('VITE_RECAPTCHA_SITE_KEY is required.');

const parsedEndpoint = new URL(endpoint);
if (parsedEndpoint.protocol !== 'https:' || parsedEndpoint.pathname !== '/api/send-inquiry') {
  throw new Error('VITE_INQUIRY_API_URL must be an HTTPS /api/send-inquiry endpoint.');
}
const parsedApplicationEndpoint = new URL(applicationEndpoint);
if (
  parsedApplicationEndpoint.protocol !== 'https:'
  || parsedApplicationEndpoint.pathname !== '/api/send-server-application'
) {
  throw new Error('VITE_SERVER_APPLICATION_API_URL must be an HTTPS /api/send-server-application endpoint.');
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(entryPath) : [entryPath];
  }));
  return files.flat();
}

const bundleFiles = (await filesUnder('dist')).filter((file) => /\.(?:html|js|css)$/.test(file));
const bundle = (await Promise.all(bundleFiles.map((file) => readFile(file, 'utf8')))).join('\n');

if (!bundle.includes(endpoint)) {
  throw new Error('The production bundle does not contain VITE_INQUIRY_API_URL.');
}
if (!bundle.includes(applicationEndpoint)) {
  throw new Error('The production bundle does not contain VITE_SERVER_APPLICATION_API_URL.');
}
if (!bundle.includes(recaptchaSiteKey)) {
  throw new Error('The production bundle does not contain VITE_RECAPTCHA_SITE_KEY.');
}

const forbiddenValues = [
  'AZURE_CLIENT_SECRET',
  'AZURE_CLIENT_ID',
  'AZURE_TENANT_ID',
  'GRAPH_SENDER_EMAIL',
  'INQUIRY_RECIPIENT_EMAIL',
  'RECAPTCHA_SECRET_KEY',
  'SERVER_APPLICATION_RECIPIENT_EMAIL',
];
for (const value of forbiddenValues) {
  if (bundle.includes(value)) {
    throw new Error(`The production bundle contains forbidden value: ${value}`);
  }
}

if (/https?:\/\/localhost(?::\d+)?\/api/i.test(bundle)) {
  throw new Error('The production bundle contains a localhost API address.');
}

console.log('Form build verified: public endpoint and site key embedded; no server secrets found.');
