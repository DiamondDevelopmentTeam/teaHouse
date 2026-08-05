// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ServerApplicationPage from './ServerApplicationPage.jsx';
import {
  ServerApplicationError,
  submitServerApplication,
  validateResumeFile,
} from './services/serverApplicationSubmission.ts';

const verificationReset = vi.fn();

vi.mock('./components/FormVerification.jsx', () => ({
  default: ({ verificationRef, onChange, onExpired }) => {
    verificationRef.current = { reset: verificationReset };
    return (
      <div data-testid="recaptcha">
        <button type="button" onClick={() => onChange('verified-token')}>Complete verification</button>
        <button type="button" onClick={onExpired}>Expire verification</button>
      </div>
    );
  },
}));

vi.mock('./services/serverApplicationSubmission.ts', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    submitServerApplication: vi.fn(),
    validateResumeFile: vi.fn(),
  };
});

function renderPage() {
  return render(<MemoryRouter initialEntries={['/server-application']}><ServerApplicationPage /></MemoryRouter>);
}

function choose(groupName, option) {
  fireEvent.click(within(screen.getByRole('group', { name: groupName })).getByRole('radio', { name: option }));
}

function fillValidApplication() {
  fireEvent.change(screen.getByLabelText(/Available start date/), { target: { value: '2026-09-01' } });
  choose(/Desired employment/, 'Either');
  choose(/Available weekends/, 'Yes');
  choose(/Available holidays/, 'Yes');

  const wednesday = document.querySelector('#wednesday-available');
  fireEvent.click(wednesday);
  const times = wednesday.closest('.availability-row').querySelectorAll('input[type="time"]');
  fireEvent.change(times[0], { target: { value: '10:00' } });
  fireEvent.change(times[1], { target: { value: '18:00' } });

  const values = [
    ['firstName', 'Avery'], ['lastName', 'Applicant'], ['phone', '352-555-0144'],
    ['email', 'avery@example.com'], ['streetAddress', '100 Main Street'], ['city', 'Ocala'],
    ['state', 'FL'], ['zipCode', '34470'],
    ['whyWorkHere', 'I enjoy gracious service and creating a welcoming guest experience.'],
    ['signatureName', 'Avery Applicant'],
  ];
  for (const [name, value] of values) fireEvent.change(document.querySelector(`[name="${name}"]`), { target: { value } });

  for (const [number, valuesForReference] of [[1, ['Reference One', '352-555-0101', 'Former supervisor']], [2, ['Reference Two', '352-555-0102', 'Colleague']]]) {
    const reference = within(screen.getByRole('group', { name: `Reference ${number}` }));
    fireEvent.change(reference.getByLabelText(/Name/), { target: { value: valuesForReference[0] } });
    fireEvent.change(reference.getByLabelText(/Phone number/), { target: { value: valuesForReference[1] } });
    fireEvent.change(reference.getByLabelText(/Relationship/), { target: { value: valuesForReference[2] } });
  }

  choose(/Are you at least 18/, 'Yes');
  choose(/legally authorized/, 'Yes');
  fireEvent.change(screen.getByLabelText(/Highest level of education/), { target: { value: 'Some college' } });
  choose(/willing to submit to a background check/, 'Yes');
  fireEvent.click(screen.getByLabelText(/I certify that the information/));
}

beforeEach(() => {
  vi.clearAllMocks();
  validateResumeFile.mockResolvedValue(undefined);
  submitServerApplication.mockResolvedValue({
    ok: true,
    message: 'Thank you. Your application has been received for review.',
    requestId: 'request-id',
  });
});

afterEach(cleanup);

describe('Server Application page', () => {
  it('renders the complete routed application with semantic sections and privacy notice', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Hospitality begins/ })).toBeTruthy();
    expect(screen.getByRole('form')).toBeTruthy();
    expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(9);
    expect(screen.getByText(/Please do not include Social Security numbers/)).toBeTruthy();
    const captcha = screen.getByTestId('recaptcha');
    const submit = screen.getByRole('button', { name: 'Submit Application' });
    expect(captcha.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(submit.disabled).toBe(true);
  });

  it('enables the structured schedule only for selected days', () => {
    renderPage();
    const monday = document.querySelector('#monday-available');
    const times = monday.closest('.availability-row').querySelectorAll('input[type="time"]');
    expect(times[0].disabled).toBe(true);
    fireEvent.click(monday);
    expect(times[0].disabled).toBe(false);
    expect(times[1].required).toBe(true);
  });

  it('blocks programmatic submission without reCAPTCHA and preserves the form', async () => {
    renderPage();
    fillValidApplication();
    fireEvent.submit(screen.getByRole('form'));
    expect(await screen.findByText(/Human verification is required/)).toBeTruthy();
    expect(submitServerApplication).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/First name/).value).toBe('Avery');
  });

  it('prevents duplicate submissions while the first request is pending', async () => {
    let resolveRequest;
    submitServerApplication.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderPage();
    fillValidApplication();
    fireEvent.click(screen.getByRole('button', { name: 'Complete verification' }));
    const submit = screen.getByRole('button', { name: 'Submit Application' });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(submitServerApplication).toHaveBeenCalledTimes(1));
    resolveRequest({ ok: true, message: 'Application received.', requestId: 'request-id' });
    await screen.findByText('Application received.');
  });

  it('preserves values and resets verification after a recoverable failure', async () => {
    submitServerApplication.mockRejectedValue(new ServerApplicationError('Please try again.', { requestId: 'failed-id' }));
    renderPage();
    fillValidApplication();
    fireEvent.click(screen.getByRole('button', { name: 'Complete verification' }));
    fireEvent.submit(screen.getByRole('form'));
    expect(await screen.findByText('Please try again.')).toBeTruthy();
    expect(screen.getByText(/Request ID: failed-id/)).toBeTruthy();
    expect(screen.getByLabelText(/First name/).value).toBe('Avery');
    expect(verificationReset).toHaveBeenCalledTimes(1);
  });

  it('clears the application and résumé only after success', async () => {
    renderPage();
    fillValidApplication();
    fireEvent.click(screen.getByRole('button', { name: 'Complete verification' }));
    fireEvent.submit(screen.getByRole('form'));
    const success = await screen.findByText(/received for review/);
    expect(screen.getByLabelText(/First name/).value).toBe('');
    expect(document.querySelector('#wednesday-available').checked).toBe(false);
    expect(screen.getByLabelText(/Upload résumé/).files.length).toBe(0);
    expect(verificationReset).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(success.closest('[role="status"]'));
  });
});
