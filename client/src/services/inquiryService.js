const apiBase = (import.meta.env.VITE_CONTENT_API_BASE_URL || '').trim().replace(/\/$/, '');
const submissionError = 'Your inquiry could not be submitted. Please try again.';
const configurationError = 'The online inquiry form is temporarily unavailable. Please try again later.';

async function responseData(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function submit(path, payload) {
  if (!apiBase) throw new Error(configurationError);

  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(submissionError);
  }

  const data = await responseData(response);
  if (!response.ok) {
    const message = typeof data.message === 'string' && data.message.length <= 240
      ? data.message
      : submissionError;
    throw new Error(message);
  }

  return data;
}

export const submitInquiry = (payload) => submit('/inquiries/contact', payload);

export const inquiryService = {
  isApiConfigured: () => Boolean(apiBase),
  submitContact: submitInquiry,
  submitLargeParty: (payload) =>
    submit('/inquiries/large-parties', payload),
  submitEmployment: (payload) =>
    submit('/inquiries/employment', payload),
};
