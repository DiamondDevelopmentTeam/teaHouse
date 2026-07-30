import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FORM_TYPES,
  FormSubmissionError,
  submitForm,
} from './formSubmission.ts';

const payload = {
  formType: FORM_TYPES.GENERAL,
  name: 'Visitor',
  email: 'visitor@example.com',
  phone: '352-555-0123',
  preferredDate: '2026-08-15',
  guestCount: '4',
  inquiryCategory: 'General question',
  message: 'I would like to learn more.',
  pageUrl: 'https://diamonddevelopmentteam.github.io/teaHouse/contact',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('submitForm', () => {
  it('provides a clear developer error when the endpoint is missing', async () => {
    vi.stubEnv('VITE_INQUIRY_API_URL', '');

    try {
      await submitForm(payload);
      expect.fail('Expected the submission to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(FormSubmissionError);
      expect(error).toMatchObject({
        kind: 'configuration',
        developerMessage: 'VITE_INQUIRY_API_URL is required for form submissions.',
      });
    }
  });

  it('posts every form to the exact shared endpoint', async () => {
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

    await expect(submitForm(payload, fetchMock)).resolves.toMatchObject({
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
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: false,
      error: {
        code: 'validation_failed',
        message: 'Please check your submission and try again.',
      },
      requestId: 'validation-request-id',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(submitForm(payload, fetchMock)).rejects.toMatchObject({
      kind: 'validation',
      requestId: 'validation-request-id',
    });
  });
});
