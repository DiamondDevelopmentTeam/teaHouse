import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InquirySubmissionError,
  inquiryService,
} from './inquiryService.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('inquiryService', () => {
  it('reports an unavailable service when the public endpoint is missing', async () => {
    vi.stubEnv('VITE_INQUIRY_API_URL', '');

    await expect(inquiryService.submitContact({ name: 'Visitor' })).rejects.toMatchObject({
      name: 'InquirySubmissionError',
      kind: 'unavailable',
    });
  });

  it('posts the inquiry to the exact configured endpoint', async () => {
    vi.stubEnv(
      'VITE_INQUIRY_API_URL',
      'https://tea-house-function.azurewebsites.net/api/send-inquiry',
    );
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      message: 'Sent',
      requestId: 'request-id',
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const payload = { name: 'Visitor' };
    await expect(inquiryService.submitContact(payload)).resolves.toMatchObject({
      ok: true,
      requestId: 'request-id',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://tea-house-function.azurewebsites.net/api/send-inquiry',
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload);
  });

  it('classifies rejected payloads as validation errors', async () => {
    vi.stubEnv(
      'VITE_INQUIRY_API_URL',
      'https://tea-house-function.azurewebsites.net/api/send-inquiry',
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: false,
      error: {
        code: 'validation_failed',
        message: 'Please check your submission and try again.',
      },
      requestId: 'validation-request-id',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })));

    try {
      await inquiryService.submitContact({ name: '' });
      expect.fail('Expected the inquiry to be rejected.');
    } catch (error) {
      expect(error).toBeInstanceOf(InquirySubmissionError);
      expect(error).toMatchObject({
        kind: 'validation',
        requestId: 'validation-request-id',
        message: 'Please check your submission and try again.',
      });
    }
  });

  it('classifies network failures as unavailable', async () => {
    vi.stubEnv(
      'VITE_INQUIRY_API_URL',
      'https://tea-house-function.azurewebsites.net/api/send-inquiry',
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(inquiryService.submitContact({ name: 'Visitor' })).rejects.toMatchObject({
      kind: 'unavailable',
    });
  });
});
