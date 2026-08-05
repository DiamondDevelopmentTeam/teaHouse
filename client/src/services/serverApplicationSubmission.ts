const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const RESUME_TYPES = Object.freeze({
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const);

interface ApplicationResponse {
  ok: true;
  message: string;
  requestId: string;
}

interface ErrorOptions {
  field?: string;
  kind?: 'configuration' | 'validation' | 'verification' | 'submission';
  requestId?: string;
}

export class ServerApplicationError extends Error {
  field: string;
  kind: NonNullable<ErrorOptions['kind']>;
  requestId: string;

  constructor(message: string, {
    field = '',
    kind = 'submission',
    requestId = '',
  }: ErrorOptions = {}) {
    super(message);
    this.name = 'ServerApplicationError';
    this.field = field;
    this.kind = kind;
    this.requestId = requestId;
  }
}

function extension(filename: string) {
  const index = filename.lastIndexOf('.');
  return index < 0 ? '' : filename.slice(index).toLowerCase();
}

function expectedSignature(bytes: Uint8Array, fileExtension: string) {
  if (fileExtension === '.pdf') {
    return new TextDecoder('ascii').decode(bytes.slice(0, 5)) === '%PDF-';
  }
  if (fileExtension === '.doc') {
    const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (fileExtension === '.docx') {
    const zipSignature = [0x50, 0x4b, 0x03, 0x04]
      .every((value, index) => bytes[index] === value);
    const archiveIndex = new TextDecoder('windows-1252').decode(bytes);
    return zipSignature
      && archiveIndex.includes('[Content_Types].xml')
      && archiveIndex.includes('word/document.xml');
  }
  return false;
}

export async function validateResumeFile(file?: File | null) {
  if (!file) return;
  if (file.name.includes('\u0000')) {
    throw new ServerApplicationError('The résumé filename is invalid.', {
      field: 'resume',
      kind: 'validation',
    });
  }
  if (file.size <= 0) {
    throw new ServerApplicationError('The résumé file is empty.', {
      field: 'resume',
      kind: 'validation',
    });
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new ServerApplicationError('The résumé must be 5 MB or smaller.', {
      field: 'resume',
      kind: 'validation',
    });
  }
  const fileExtension = extension(file.name);
  const expectedType = RESUME_TYPES[fileExtension as keyof typeof RESUME_TYPES];
  if (!expectedType || file.type.toLowerCase() !== expectedType) {
    throw new ServerApplicationError('Upload a PDF, DOC, or DOCX résumé.', {
      field: 'resume',
      kind: 'validation',
    });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!expectedSignature(bytes, fileExtension)) {
    bytes.fill(0);
    throw new ServerApplicationError('The résumé contents do not match the selected file type.', {
      field: 'resume',
      kind: 'validation',
    });
  }
  bytes.fill(0);
}

function applicationApiUrl() {
  return (import.meta.env.VITE_SERVER_APPLICATION_API_URL || '').trim();
}

export function isServerApplicationConfigured() {
  return Boolean(applicationApiUrl());
}

export async function submitServerApplication(
  formData: FormData,
  fetchImpl: typeof fetch = fetch,
): Promise<ApplicationResponse> {
  const endpoint = applicationApiUrl();
  if (!endpoint) {
    throw new ServerApplicationError('The application service is temporarily unavailable.', {
      kind: 'configuration',
    });
  }

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new ServerApplicationError('Your application could not be submitted. Please try again.');
  }

  let data: Record<string, unknown> = {};
  try {
    data = await response.json() as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = data.error && typeof data.error === 'object'
      ? data.error as Record<string, unknown>
      : {};
    const code = typeof error.code === 'string' ? error.code : '';
    const message = typeof error.message === 'string' && error.message.length <= 300
      ? error.message
      : 'Your application could not be submitted. Please try again.';
    throw new ServerApplicationError(message, {
      field: typeof error.field === 'string' ? error.field : '',
      kind: code === 'verification_failed'
        ? 'verification'
        : code === 'validation_failed' ? 'validation' : 'submission',
      requestId: typeof data.requestId === 'string' ? data.requestId : '',
    });
  }

  if (data.ok !== true || typeof data.message !== 'string' || typeof data.requestId !== 'string') {
    throw new ServerApplicationError('Your application could not be submitted. Please try again.');
  }
  return data as unknown as ApplicationResponse;
}

export const RESUME_LIMIT_BYTES = MAX_RESUME_BYTES;
