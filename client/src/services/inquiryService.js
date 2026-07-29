import { business } from '../data/business.js';

const apiBase = (import.meta.env.VITE_CONTENT_API_BASE_URL || '').trim().replace(/\/$/, '');

function mailto(type, payload) {
  const subject = encodeURIComponent(`1890 Tea House ${type} inquiry`);
  const body = encodeURIComponent(
    Object.entries(payload)
      .filter(([key, value]) =>
        !['recaptchaToken', 'website'].includes(key) && value !== '' && value !== false)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n'),
  );
  return { mode: 'mailto', href: `mailto:${business.email}?subject=${subject}&body=${body}` };
}

async function responseData(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function submit(path, type, payload) {
  if (!apiBase) return mailto(type, payload);
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('We could not send your request. Please call or email the Tea House.');
  }
  const data = await responseData(response);
  if (!response.ok) {
    const message = typeof data.message === 'string' && data.message.length <= 240
      ? data.message
      : 'We could not send your request. Please call or email the Tea House.';
    throw new Error(message);
  }
  return { mode: 'api', data };
}

export const inquiryService = {
  isApiConfigured: () => Boolean(apiBase),
  submitContact: (payload) => submit('/inquiries/contact', 'contact', payload),
  submitLargeParty: (payload) =>
    submit('/inquiries/large-parties', 'large party reservation', payload),
  submitEmployment: (payload) =>
    submit('/inquiries/employment', 'employment application', payload),
};
