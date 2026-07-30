import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export function isFormVerificationEnabled() {
  return Boolean((import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim());
}

export default function FormVerification({
  verificationRef,
  onChange,
  onExpired,
  onError,
}) {
  const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
  if (!siteKey) return null;

  return (
    <div className="page-form-recaptcha">
      <ReCAPTCHA
        ref={verificationRef}
        sitekey={siteKey}
        onChange={(token) => onChange(token || '')}
        onExpired={onExpired}
        onErrored={onError}
      />
    </div>
  );
}
