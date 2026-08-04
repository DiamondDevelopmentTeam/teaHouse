import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function FormVerification({
  verificationRef,
  onChange,
  onExpired,
  onError,
}) {
  const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
  const [scriptState, setScriptState] = useState('loading');
  const errorReported = useRef(false);

  const reportError = () => {
    setScriptState('error');
    if (!errorReported.current) {
      errorReported.current = true;
      onError();
    }
  };

  if (!siteKey) {
    return (
      <div className="page-form-recaptcha is-error" role="alert">
        <p>Human verification is temporarily unavailable. Please refresh the page or contact the Tea House directly.</p>
      </div>
    );
  }

  return (
    <div className={`page-form-recaptcha is-${scriptState}`}>
      <div className="page-form-recaptcha__widget">
        <ReCAPTCHA
          ref={verificationRef}
          sitekey={siteKey}
          onChange={(token) => {
            setScriptState('ready');
            onChange(token || '');
          }}
          onExpired={onExpired}
          onErrored={reportError}
          asyncScriptOnLoad={(state) => {
            if (state?.errored) reportError();
            if (state?.loaded) setScriptState('ready');
          }}
        />
      </div>
      {scriptState === 'loading' ? (
        <p className="page-form-recaptcha__message" role="status">Loading human verification…</p>
      ) : null}
      {scriptState === 'error' ? (
        <p className="page-form-recaptcha__message" role="alert">Human verification could not load. Please refresh the page or contact the Tea House directly.</p>
      ) : null}
    </div>
  );
}
