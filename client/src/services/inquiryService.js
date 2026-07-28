import { business } from '../data/business.js';

const apiBase = (import.meta.env.VITE_CONTENT_API_BASE_URL || '').replace(/\/$/, '');

function mailto(type, payload) {
  const subject = encodeURIComponent(`1890 Tea House ${type} inquiry`);
  const body = encodeURIComponent(
    Object.entries(payload)
      .filter(([, value]) => value !== '' && value !== false)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n'),
  );
  return { mode: 'mailto', href: `mailto:${business.email}?subject=${subject}&body=${body}` };
}

async function submit(path, type, payload) {
  if (!apiBase) return mailto(type, payload);
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('We could not send your request. Please call or email the Tea House.');
  return { mode: 'api', data: await response.json() };
}

export const inquiryService = {
  submitContact: (payload) => submit('/inquiries/contact', 'contact', payload),
  submitLargeParty: (payload) =>
    submit('/inquiries/large-parties', 'large party reservation', payload),
  submitEmployment: (payload) =>
    submit('/inquiries/employment', 'employment application', payload),
};
