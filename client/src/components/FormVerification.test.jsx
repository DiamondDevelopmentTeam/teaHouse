// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormVerification from './FormVerification.jsx';

const captcha = vi.hoisted(() => ({ props: null }));

vi.mock('react-google-recaptcha', () => ({
  default: (props) => {
    captcha.props = props;
    return null;
  },
}));

beforeEach(() => {
  captcha.props = null;
  vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'public-test-site-key');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('FormVerification', () => {
  it('shows a professional blocking error instead of hiding when the key is missing', () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', '');
    render(<FormVerification onChange={() => {}} onExpired={() => {}} onError={() => {}} />);

    expect(screen.getByRole('alert').textContent).toMatch(/temporarily unavailable/i);
    expect(captcha.props).toBeNull();
  });

  it('uses the environment key and reports script loading failure', () => {
    const onError = vi.fn();
    render(<FormVerification onChange={() => {}} onExpired={() => {}} onError={onError} />);

    expect(captcha.props.sitekey).toBe('public-test-site-key');
    act(() => captcha.props.asyncScriptOnLoad({ errored: true }));

    expect(onError).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert').textContent).toMatch(/could not load/i);
  });

  it('passes successful tokens through and reports expiration', () => {
    const onChange = vi.fn();
    const onExpired = vi.fn();
    render(<FormVerification onChange={onChange} onExpired={onExpired} onError={() => {}} />);

    act(() => captcha.props.onChange('browser-token'));
    act(() => captcha.props.onExpired());

    expect(onChange).toHaveBeenCalledWith('browser-token');
    expect(onExpired).toHaveBeenCalledOnce();
  });
});
