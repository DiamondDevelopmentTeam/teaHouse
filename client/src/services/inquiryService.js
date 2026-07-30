const submissionError = 'Your inquiry could not be submitted. Please try again.';
const configurationError = 'The online inquiry service is not configured.';

export class InquirySubmissionError extends Error {
  constructor(message, { kind = 'unavailable', requestId = '' } = {}) {
    super(message);
    this.name = 'InquirySubmissionError';
    this.kind = kind;
    this.requestId = requestId;
  }
}

function contactApiUrl() {
  return (import.meta.env.VITE_INQUIRY_API_URL || '').trim();
}

function legacyApiBase() {
  return (import.meta.env.VITE_CONTENT_API_BASE_URL || '').trim().replace(/\/$/, '');
}

function legacyApiUrl(path) {
  const base = legacyApiBase();
  return base ? `${base}${path}` : '';
}

async function responseData(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function publicMessage(data, fallback) {
  const message = typeof data?.error?.message === 'string'
    ? data.error.message
    : data?.message;
  return typeof message === 'string' && message.length <= 240 ? message : fallback;
}

async function submit(url, payload) {
  if (!url) throw new InquirySubmissionError(configurationError);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new InquirySubmissionError(submissionError);
  }

  const data = await responseData(response);
  if (!response.ok) {
    const kind = [400, 413, 415].includes(response.status) ? 'validation' : 'unavailable';
    throw new InquirySubmissionError(publicMessage(data, submissionError), {
      kind,
      requestId: typeof data.requestId === 'string' ? data.requestId : '',
    });
  }

  return data;
}

export const submitInquiry = (payload) => submit(contactApiUrl(), payload);

export const inquiryService = {
  isApiConfigured: () => Boolean(contactApiUrl()),
  submitContact: submitInquiry,
  submitLargeParty: (payload) =>
    submit(legacyApiUrl('/inquiries/large-parties'), payload),
  submitEmployment: (payload) =>
    submit(legacyApiUrl('/inquiries/employment'), payload),
};
