// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ServerApplicationError,
  submitServerApplication,
  validateResumeFile,
} from './serverApplicationSubmission.ts';

function fileWithArrayBuffer(bytes: Uint8Array, name: string, type: string) {
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return file;
}

afterEach(() => vi.unstubAllEnvs());

describe('server application submission service', () => {
  it('accepts a PDF only when its extension, MIME type, and signature agree', async () => {
    const pdf = fileWithArrayBuffer(
      new TextEncoder().encode('%PDF-1.7\n%%EOF'),
      'resume.pdf',
      'application/pdf',
    );
    await expect(validateResumeFile(pdf)).resolves.toBeUndefined();
  });

  it('rejects oversized, unsupported, and mismatched files', async () => {
    const oversized = fileWithArrayBuffer(
      new Uint8Array((5 * 1024 * 1024) + 1),
      'resume.pdf',
      'application/pdf',
    );
    const executable = fileWithArrayBuffer(new Uint8Array([77, 90]), 'resume.exe', 'application/x-msdownload');
    const disguised = fileWithArrayBuffer(new TextEncoder().encode('not a pdf'), 'resume.pdf', 'application/pdf');
    await expect(validateResumeFile(oversized)).rejects.toMatchObject({ field: 'resume' });
    await expect(validateResumeFile(executable)).rejects.toMatchObject({ field: 'resume' });
    await expect(validateResumeFile(disguised)).rejects.toMatchObject({ field: 'resume' });
  });

  it('posts multipart data without overriding the browser boundary', async () => {
    vi.stubEnv('VITE_SERVER_APPLICATION_API_URL', 'https://api.example.com/api/send-server-application');
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      message: 'Application received.',
      requestId: 'request-id',
    }), { status: 202, headers: { 'Content-Type': 'application/json' } }));
    const formData = new FormData();
    formData.set('firstName', 'Avery');
    await submitServerApplication(formData, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.com/api/send-server-application',
      expect.objectContaining({
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('returns safe field and verification errors from the API', async () => {
    vi.stubEnv('VITE_SERVER_APPLICATION_API_URL', 'https://api.example.com/api/send-server-application');
    const response = new Response(JSON.stringify({
      ok: false,
      error: { code: 'verification_failed', message: 'Complete verification again.', field: 'recaptchaToken' },
      requestId: 'request-id',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    await expect(submitServerApplication(new FormData(), vi.fn().mockResolvedValue(response)))
      .rejects.toEqual(expect.objectContaining({
        name: 'ServerApplicationError',
        kind: 'verification',
        field: 'recaptchaToken',
        requestId: 'request-id',
      }));
  });

  it('fails closed when the public endpoint is missing', async () => {
    vi.stubEnv('VITE_SERVER_APPLICATION_API_URL', '');
    await expect(submitServerApplication(new FormData(), vi.fn()))
      .rejects.toBeInstanceOf(ServerApplicationError);
  });
});
