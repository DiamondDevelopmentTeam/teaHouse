export const FORM_TYPES = Object.freeze({
  GENERAL: 'general',
  RESERVATION: 'reservation',
  EVENT: 'event',
  CONTACT: 'contact',
} as const);

export type FormType = typeof FORM_TYPES[keyof typeof FORM_TYPES];

export interface FormSubmission {
  formType: FormType;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  guestCount: string;
  inquiryCategory: string;
  message: string;
  pageUrl: string;
  preferredTime?: string;
  preOrders?: string[];
  policyAgreement?: boolean;
  website?: string;
  recaptchaToken?: string;
}

interface SubmissionResponse {
  ok: true;
  message: string;
  requestId: string;
}

interface SubmissionErrorOptions {
  kind?: 'configuration' | 'validation' | 'submission';
  requestId?: string;
  developerMessage?: string;
}

const submissionError = 'Your request could not be sent. Please try again.';

export class FormSubmissionError extends Error {
  kind: NonNullable<SubmissionErrorOptions['kind']>;
  requestId: string;
  developerMessage: string;

  constructor(message: string, {
    kind = 'submission',
    requestId = '',
    developerMessage = '',
  }: SubmissionErrorOptions = {}) {
    super(message);
    this.name = 'FormSubmissionError';
    this.kind = kind;
    this.requestId = requestId;
    this.developerMessage = developerMessage;
  }
}

function apiUrl() {
  return (import.meta.env.VITE_INQUIRY_API_URL || '').trim();
}

async function responseData(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function publicMessage(data: Record<string, unknown>, fallback: string) {
  const error = data.error && typeof data.error === 'object'
    ? data.error as Record<string, unknown>
    : {};
  const message = typeof error.message === 'string' ? error.message : data.message;
  return typeof message === 'string' && message.length <= 240 ? message : fallback;
}

export function isFormSubmissionConfigured() {
  return Boolean(apiUrl());
}

export async function submitForm(
  payload: FormSubmission,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmissionResponse> {
  const endpoint = apiUrl();
  if (!endpoint) {
    throw new FormSubmissionError(submissionError, {
      kind: 'configuration',
      developerMessage: 'VITE_INQUIRY_API_URL is required for form submissions.',
    });
  }

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new FormSubmissionError(submissionError);
  }

  const data = await responseData(response);
  if (!response.ok) {
    const requestId = typeof data.requestId === 'string' ? data.requestId : '';
    const kind = [400, 413, 415].includes(response.status) ? 'validation' : 'submission';
    throw new FormSubmissionError(publicMessage(data, submissionError), {
      kind,
      requestId,
    });
  }

  if (
    data.ok !== true
    || typeof data.message !== 'string'
    || typeof data.requestId !== 'string'
  ) {
    throw new FormSubmissionError(submissionError);
  }

  return data as unknown as SubmissionResponse;
}
