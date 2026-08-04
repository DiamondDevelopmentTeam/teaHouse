// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FORM_TYPES,
  FormSubmissionError,
  submitForm,
} from './services/formSubmission.ts';
import { ContactForm, LargePartyForm } from './Pages.jsx';

vi.mock('./components/FormVerification.jsx', async () => {
  const ReactModule = await import('react');
  return {
    default: function MockFormVerification({ onChange, onExpired, onError }) {
      return ReactModule.createElement(
        'div',
        null,
        ReactModule.createElement('button', {
          type: 'button',
          onClick: () => onChange('verified-browser-token'),
        }, 'Complete human verification'),
        ReactModule.createElement('button', {
          type: 'button',
          onClick: onExpired,
        }, 'Expire human verification'),
        ReactModule.createElement('button', {
          type: 'button',
          onClick: onError,
        }, 'Fail human verification'),
      );
    },
  };
});

vi.mock('./services/formSubmission.ts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    submitForm: vi.fn(),
  };
});

async function completeContactForm(user) {
  await user.type(screen.getByLabelText('Name'), 'Visitor Name');
  await user.type(screen.getByLabelText('Email'), 'visitor@example.com');
  await user.type(screen.getByLabelText('Phone'), '352-555-0123');
  await user.type(screen.getByLabelText('Preferred date'), '2026-08-15');
  await user.type(screen.getByLabelText('Guest count'), '4');
  await user.type(screen.getByLabelText('Message'), 'Please tell me about afternoon tea.');
  await user.click(screen.getByRole('button', { name: 'Complete human verification' }));
}

async function completeLargePartyForm(user, occasion = 'Tea Room') {
  await user.type(screen.getByLabelText('Full name'), 'Party Planner');
  await user.type(screen.getByLabelText('Phone'), '352-555-0188');
  await user.type(screen.getByLabelText('Email'), 'planner@example.com');
  await user.type(screen.getByLabelText('Requested date'), '2026-09-12');
  await user.type(screen.getByLabelText('Requested time'), '14:30');
  await user.type(screen.getByLabelText('Number of guests'), '16');
  await user.selectOptions(screen.getByLabelText('Occasion or reservation type'), occasion);
  await user.type(screen.getByLabelText('Message'), 'We would like a quiet room.');
  await user.click(screen.getByLabelText(/I have read and agree/));
  await user.click(screen.getByRole('button', { name: 'Complete human verification' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'public-test-site-key');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('website forms', () => {
  it('submits the Visit form through the shared service with the general form type', async () => {
    submitForm.mockResolvedValue({
      ok: true,
      message: 'Thank you! Your inquiry has been sent.',
      requestId: 'contact-request-id',
    });
    const user = userEvent.setup();
    render(<ContactForm />);
    await completeContactForm(user);

    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    await waitFor(() => expect(submitForm).toHaveBeenCalledOnce());
    expect(submitForm.mock.calls[0][0]).toMatchObject({
      formType: FORM_TYPES.GENERAL,
      websiteName: '1890 Tea House',
      inquiryCategory: 'General question',
      name: 'Visitor Name',
      recaptchaToken: 'verified-browser-token',
      pageUrl: 'http://localhost:3000/',
    });
  });

  it('submits reservation and event requests with the correct form type', async () => {
    submitForm.mockResolvedValue({
      ok: true,
      message: 'Thank you. Your request has been sent.',
      requestId: 'reservation-request-id',
    });
    const user = userEvent.setup();
    const { unmount } = render(<LargePartyForm />);
    await completeLargePartyForm(user);
    await user.click(screen.getByRole('button', { name: 'Send large-party request' }));

    await waitFor(() => expect(submitForm).toHaveBeenCalledOnce());
    expect(submitForm.mock.calls[0][0]).toMatchObject({
      formType: FORM_TYPES.RESERVATION,
      inquiryCategory: 'Tea Room',
      guestCount: '16',
      policyAgreement: true,
    });

    unmount();
    vi.clearAllMocks();
    render(<LargePartyForm />);
    await completeLargePartyForm(user, 'Private event');
    await user.click(screen.getByRole('button', { name: 'Send large-party request' }));

    await waitFor(() => expect(submitForm).toHaveBeenCalledOnce());
    expect(submitForm.mock.calls[0][0]).toMatchObject({
      formType: FORM_TYPES.EVENT,
      inquiryCategory: 'Private event',
    });
  });

  it('preserves entered values after a failed request', async () => {
    submitForm.mockRejectedValue(new FormSubmissionError('Could not send', {
      kind: 'submission',
      requestId: 'failed-request-id',
    }));
    const user = userEvent.setup();
    render(<ContactForm />);
    await completeContactForm(user);

    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    expect(await screen.findByText(/Your information is still in the form/)).toBeTruthy();
    expect(screen.getByLabelText('Name').value).toBe('Visitor Name');
    expect(screen.getByLabelText('Message').value).toBe(
      'Please tell me about afternoon tea.',
    );
  });

  it('clears fields and shows a confirmation after success', async () => {
    submitForm.mockResolvedValue({
      ok: true,
      message: 'Thank you! Your inquiry has been sent.',
      requestId: 'success-request-id',
    });
    const user = userEvent.setup();
    render(<ContactForm />);
    await completeContactForm(user);

    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    expect(await screen.findByText(/Reference: success-request-id/)).toBeTruthy();
    expect(screen.getByLabelText('Name').value).toBe('');
    expect(screen.getByLabelText('Message').value).toBe('');
    expect(screen.getByRole('button', { name: 'Send Inquiry' }).disabled).toBe(true);
  });

  it('keeps submission disabled until reCAPTCHA succeeds and handles expiration', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    const submitButton = screen.getByRole('button', { name: 'Send Inquiry' });

    expect(submitButton.disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Complete human verification' }));
    expect(submitButton.disabled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Expire human verification' }));

    expect(submitButton.disabled).toBe(true);
    expect(screen.getByText('Verification expired. Please complete it again.')).toBeTruthy();
  });

  it('blocks duplicate submissions while the first request is pending', async () => {
    submitForm.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<ContactForm />);
    await completeContactForm(user);
    const button = screen.getByRole('button', { name: 'Send Inquiry' });

    await user.click(button);
    expect((await screen.findByRole('button', { name: 'Sending…' })).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Sending…' }));

    expect(submitForm).toHaveBeenCalledOnce();
  });
});
