import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FormVerification from './components/FormVerification.jsx';
import OptimizedImage from './components/OptimizedImage.jsx';
import PageShell from './components/PageShell.jsx';
import { business } from './data/business.js';
import { Meta } from './Pages.jsx';
import {
  ServerApplicationError,
  submitServerApplication,
  validateResumeFile,
} from './services/serverApplicationSubmission.ts';
import interior from './assets/images/migrated/about/interior.webp';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EXPERIENCE_OPTIONS = [
  'Customer service experience',
  'Food and beverage handling',
  'POS or cash register experience',
  'Ability to work in fast-paced environments',
  'Comfort carrying trays and standing for extended periods',
];

function localDate() {
  const value = new Date();
  const offset = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function initialAvailability() {
  return Object.fromEntries(DAYS.map((day) => [day, {
    available: false,
    earliest: '',
    latest: '',
  }]));
}

function ChoiceGroup({ legend, name, options, required = true, hint }) {
  return (
    <fieldset className="application-choice-group">
      <legend>{legend}{required ? <span aria-hidden="true"> *</span> : null}</legend>
      {hint ? <p className="application-field-hint">{hint}</p> : null}
      <div className="application-choice-list">
        {options.map((option) => (
          <label key={option} className="page-check">
            <input type="radio" name={name} value={option} required={required} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ApplicationSection({ number, title, intro, children }) {
  return (
    <fieldset className="application-section">
      <legend><span>{number}</span>{title}</legend>
      {intro ? <p className="application-section-intro">{intro}</p> : null}
      <div className="application-fields">{children}</div>
    </fieldset>
  );
}

function Field({ label, name, required = false, hint, className = '', children, ...inputProps }) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <label className={`application-field ${className}`.trim()}>
      <span>{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      {children || <input name={name} required={required} aria-describedby={hintId} {...inputProps} />}
      {hint ? <small id={hintId}>{hint}</small> : null}
    </label>
  );
}

export default function ServerApplicationPage() {
  const [availability, setAvailability] = useState(initialAvailability);
  const [availabilityError, setAvailabilityError] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationUnavailable, setVerificationUnavailable] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '', requestId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const verificationRef = useRef(null);
  const submittingRef = useRef(false);
  const statusRef = useRef(null);

  const resetVerification = () => {
    verificationRef.current?.reset?.();
    setVerificationToken('');
  };

  useEffect(() => {
    if (status.type === 'success') statusRef.current?.focus();
  }, [status.type]);

  const updateDay = (day, change) => {
    setAvailability((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...change,
        ...(change.available === false ? { earliest: '', latest: '' } : {}),
      },
    }));
    setAvailabilityError('');
  };

  const focusField = (field) => {
    const form = formRef.current;
    if (!form) return;
    const aliases = {
      form: '.application-form',
      availability: '#weekly-availability',
      recaptchaToken: '.page-form-recaptcha',
      references: '[name="reference1Name"]',
    };
    const safeField = String(field).replace(/[^a-zA-Z0-9_-]/g, '');
    const selector = aliases[field] || `[name="${safeField}"]`;
    const target = form.querySelector(selector);
    target?.setAttribute?.('aria-invalid', 'true');
    target?.focus?.();
    target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    const form = event.currentTarget;
    setStatus({ type: 'validating', message: 'Checking your application…', requestId: '' });
    setAvailabilityError('');
    setResumeError('');

    if (!form.reportValidity()) {
      setStatus({ type: 'validation', message: 'Please complete the required application fields.', requestId: '' });
      form.querySelector(':invalid')?.focus();
      submittingRef.current = false;
      return;
    }

    const weeklyAvailability = DAYS.map((day) => ({ day, ...availability[day] }));
    if (!weeklyAvailability.some(({ available }) => available)) {
      setAvailabilityError('Select at least one day and provide a valid start and end time.');
      setStatus({ type: 'validation', message: 'Please complete your weekly availability.', requestId: '' });
      focusField('availability');
      submittingRef.current = false;
      return;
    }
    if (weeklyAvailability.some(({ available, earliest, latest }) => available && (!earliest || !latest || earliest >= latest))) {
      setAvailabilityError('Each available day needs an end time later than its start time.');
      setStatus({ type: 'validation', message: 'Please correct your weekly availability.', requestId: '' });
      focusField('availability');
      submittingRef.current = false;
      return;
    }

    const resume = form.elements.resume.files?.[0];
    try {
      await validateResumeFile(resume);
    } catch (error) {
      const message = error instanceof ServerApplicationError
        ? error.message
        : 'Choose a valid résumé file.';
      setResumeError(message);
      setStatus({ type: 'validation', message, requestId: '' });
      focusField('resume');
      submittingRef.current = false;
      return;
    }

    if (!verificationToken) {
      setVerificationError('Complete the “I’m not a robot” verification before submitting.');
      setStatus({ type: 'validation', message: 'Human verification is required.', requestId: '' });
      focusField('recaptchaToken');
      submittingRef.current = false;
      return;
    }

    const formData = new FormData(form);
    formData.set('availability', JSON.stringify(weeklyAvailability));
    formData.set('pageUrl', window.location.href);
    formData.set('recaptchaToken', verificationToken);

    setIsSubmitting(true);
    setStatus({ type: 'submitting', message: 'Submitting application…', requestId: '' });
    try {
      const result = await submitServerApplication(formData);
      form.reset();
      setAvailability(initialAvailability());
      setResumeError('');
      setVerificationError('');
      setVerificationUnavailable(false);
      resetVerification();
      setStatus({ type: 'success', message: result.message, requestId: result.requestId });
    } catch (error) {
      const applicationError = error instanceof ServerApplicationError ? error : null;
      if (applicationError?.field === 'resume') setResumeError(applicationError.message);
      if (applicationError?.kind === 'verification') {
        setVerificationUnavailable(false);
        setVerificationError('Verification expired or was not accepted. Please complete it again.');
      }
      resetVerification();
      setStatus({
        type: applicationError?.kind === 'validation' ? 'validation' : 'error',
        message: applicationError?.message || 'Your application could not be submitted. Please try again.',
        requestId: applicationError?.requestId || '',
      });
      if (applicationError?.field) focusField(applicationError.field);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <Meta
        title="Server Application"
        description="Apply for a server position with 1890 Tea House in downtown Ocala."
        path="/server-application"
        image={interior}
      />

      <section className="application-hero">
        <div className="application-hero__copy">
          <p className="page-eyebrow">Join our team</p>
          <h1>Hospitality begins with a warm welcome.</h1>
          <p>We’re excited that you’re interested in joining the 1890 Tea House team.</p>
        </div>
        <div className="application-hero__media">
          <OptimizedImage src={interior} alt="The welcoming dining room inside 1890 Tea House" width={1442} height={903} eager />
          <span>Diamond Suites · Downtown Ocala</span>
        </div>
      </section>

      <section className="application-intro page-section">
        <div>
          <p className="page-eyebrow">Server application</p>
          <h2>A thoughtful experience, one table at a time.</h2>
        </div>
        <div className="page-prose">
          <p>Our servers play a special role in creating a warm, relaxing, and memorable experience for every guest who walks through our doors.</p>
          <p>If you’re friendly, reliable, and enjoy providing excellent service, we’d love to learn more about you.</p>
          <p>Located at Diamond Suites Downtown Ocala, 1890 Tea House brings together tea, food, gatherings, and genuine hospitality in a distinctive historic setting.</p>
        </div>
      </section>

      <section className="application-form-wrap page-section" aria-labelledby="application-form-title">
        <header className="application-form-header">
          <p className="page-eyebrow">Your application</p>
          <h2 id="application-form-title">Tell us about yourself.</h2>
          <p>Fields marked with an asterisk are required. Please do not enter highly sensitive information anywhere in this form.</p>
        </header>

        <form
          ref={formRef}
          className="application-form"
          onSubmit={handleSubmit}
          noValidate={false}
          aria-labelledby="application-form-title"
          onInvalid={(event) => event.target.setAttribute('aria-invalid', 'true')}
          onInput={(event) => event.target.removeAttribute('aria-invalid')}
          onChange={(event) => event.target.removeAttribute('aria-invalid')}
        >
          <ApplicationSection number="01" title="Position and availability" intro="Share when you could begin and the weekly schedule that works for you.">
            <Field label="Position applying for" name="position" required defaultValue="Server" readOnly />
            <Field label="Application date" name="applicationDate" type="date" required defaultValue={localDate()} />
            <Field label="Available start date" name="availableStartDate" type="date" required min={localDate()} />
            <ChoiceGroup legend="Desired employment" name="desiredEmployment" options={['Full-time', 'Part-time', 'Either']} />
            <ChoiceGroup legend="Available weekends" name="availableWeekends" options={['Yes', 'No']} />
            <ChoiceGroup legend="Available holidays" name="availableHolidays" options={['Yes', 'No']} />

            <fieldset id="weekly-availability" className="weekly-availability" tabIndex="-1" aria-describedby={availabilityError ? 'availability-error' : 'availability-help'}>
              <legend>Weekly availability <span aria-hidden="true">*</span></legend>
              <p id="availability-help" className="application-field-hint">Select each day you are available, then enter your earliest start and latest end time.</p>
              <div className="availability-table" role="group" aria-label="Weekly availability schedule">
                {DAYS.map((day) => {
                  const dayId = day.toLowerCase();
                  const details = availability[day];
                  return (
                    <div className={`availability-row${details.available ? ' is-available' : ''}`} key={day}>
                      <label className="availability-day" htmlFor={`${dayId}-available`}>
                        <input
                          id={`${dayId}-available`}
                          type="checkbox"
                          checked={details.available}
                          onChange={(event) => updateDay(day, { available: event.target.checked })}
                        />
                        <span>{day}</span>
                      </label>
                      <label>
                        <span>Earliest start</span>
                        <input
                          type="time"
                          value={details.earliest}
                          disabled={!details.available}
                          required={details.available}
                          onChange={(event) => updateDay(day, { earliest: event.target.value })}
                        />
                      </label>
                      <label>
                        <span>Latest end</span>
                        <input
                          type="time"
                          value={details.latest}
                          disabled={!details.available}
                          required={details.available}
                          onChange={(event) => updateDay(day, { latest: event.target.value })}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              {availabilityError ? <p id="availability-error" className="application-field-error" role="alert">{availabilityError}</p> : null}
            </fieldset>
          </ApplicationSection>

          <ApplicationSection number="02" title="Applicant information">
            <Field label="First name" name="firstName" autoComplete="given-name" maxLength="80" required />
            <Field label="Last name" name="lastName" autoComplete="family-name" maxLength="80" required />
            <Field label="Phone number" name="phone" type="tel" autoComplete="tel" inputMode="tel" minLength="7" maxLength="40" required />
            <Field label="Email address" name="email" type="email" autoComplete="email" maxLength="254" required />
            <Field label="Street address" name="streetAddress" autoComplete="street-address" maxLength="160" required className="application-field--wide" />
            <Field label="City" name="city" autoComplete="address-level2" maxLength="80" required />
            <Field label="State" name="state" autoComplete="address-level1" maxLength="2" pattern="[A-Za-z]{2}" required hint="Use the two-letter abbreviation." />
            <Field label="ZIP code" name="zipCode" autoComplete="postal-code" inputMode="numeric" maxLength="10" pattern="\d{5}(-\d{4})?" required hint="Five digits or ZIP+4." />
          </ApplicationSection>

          <ApplicationSection number="03" title="Employment eligibility" intro="Do not upload or enter immigration documents or identification numbers.">
            <ChoiceGroup legend="Are you at least 18 years old?" name="isAdult" options={['Yes', 'No']} />
            <ChoiceGroup legend="Are you legally authorized to work in the United States?" name="workAuthorized" options={['Yes', 'No']} />
          </ApplicationSection>

          <ApplicationSection number="04" title="Experience and qualifications">
            <fieldset className="application-choice-group application-field--wide">
              <legend>Relevant experience</legend>
              <div className="application-check-grid">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <label className="page-check" key={option}>
                    <input type="checkbox" name="experience" value={option} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Why would you like to work at 1890 Tea House?" name="whyWorkHere" required className="application-field--wide">
              <textarea name="whyWorkHere" rows="6" maxLength="1500" required aria-describedby="whyWorkHere-hint" />
            </Field>
            <p id="whyWorkHere-hint" className="application-field-hint application-field--wide">Maximum 1,500 characters.</p>
            <Field label="Relevant certifications" name="certifications" className="application-field--wide" hint="Optional. For example, a food-handling certification.">
              <textarea name="certifications" rows="3" maxLength="500" aria-describedby="certifications-hint" />
            </Field>
          </ApplicationSection>

          <ApplicationSection number="05" title="Education">
            <Field label="Highest level of education completed" name="educationLevel" required>
              <select name="educationLevel" defaultValue="" required>
                <option value="" disabled>Select one</option>
                <option>High school</option><option>GED</option><option>Some college</option>
                <option>Associate degree</option><option>Bachelor&apos;s degree</option>
                <option>Graduate degree</option><option>Other</option>
              </select>
            </Field>
            <Field label="School name" name="schoolName" maxLength="120" hint="Optional." />
          </ApplicationSection>

          <ApplicationSection number="06" title="References" intro="Please provide two people who can speak to your reliability or experience. Do not include home addresses or email addresses.">
            {[1, 2].map((number) => (
              <fieldset className="reference-group application-field--wide" key={number}>
                <legend>Reference {number}</legend>
                <div>
                  <Field label="Name" name={`reference${number}Name`} maxLength="120" required />
                  <Field label="Phone number" name={`reference${number}Phone`} type="tel" inputMode="tel" minLength="7" maxLength="40" required />
                  <Field label="Relationship" name={`reference${number}Relationship`} maxLength="80" required />
                </div>
              </fieldset>
            ))}
          </ApplicationSection>

          <ApplicationSection number="07" title="Résumé" intro="A résumé is welcome but not required.">
            <Field label="Upload résumé" name="resume" className="application-field--wide" hint="Accepted formats: PDF, DOC, or DOCX. Maximum size: 5 MB.">
              <input
                id="resume"
                name="resume"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                aria-describedby={`resume-hint${resumeError ? ' resume-error' : ''}`}
                aria-invalid={Boolean(resumeError)}
                onChange={async (event) => {
                  try {
                    await validateResumeFile(event.target.files?.[0]);
                    setResumeError('');
                  } catch (error) {
                    setResumeError(error instanceof Error ? error.message : 'Choose a valid résumé file.');
                  }
                }}
              />
            </Field>
            {resumeError ? <p id="resume-error" className="application-field-error application-field--wide" role="alert">{resumeError}</p> : null}
          </ApplicationSection>

          <ApplicationSection number="08" title="Background-check willingness">
            <ChoiceGroup
              legend="Are you willing to submit to a background check if required?"
              name="backgroundCheck"
              options={['Yes', 'No']}
              hint="Your answer is not authorization to conduct a background check."
            />
          </ApplicationSection>

          <ApplicationSection number="09" title="Applicant certification and signature">
            <label className="page-check application-certification application-field--wide">
              <input type="checkbox" name="certification" value="true" required />
              <span>I certify that the information provided is true and complete to the best of my knowledge.</span>
            </label>
            <Field label="Typed name as signature" name="signatureName" autoComplete="name" maxLength="160" required hint="Typing your name serves as your electronic acknowledgment for this application submission." />
            <Field label="Signature date" name="signatureDate" type="date" required defaultValue={localDate()} />
          </ApplicationSection>

          <div className="page-form-honeypot" aria-hidden="true">
            <label>Website<input name="website" type="text" tabIndex="-1" autoComplete="off" /></label>
          </div>

          <aside className="application-privacy" aria-labelledby="application-privacy-title">
            <p className="page-eyebrow">Privacy notice</p>
            <h2 id="application-privacy-title">Share only what belongs in an employment application.</h2>
            <p>Information submitted through this application will be used to review your interest in employment with 1890 Tea House and to contact you regarding your application. Please do not include Social Security numbers, banking information, medical information, account passwords, or other highly sensitive information.</p>
            <ul>
              <li>Submission does not guarantee employment or an interview.</li>
              <li>Upload a résumé only in an accepted format.</li>
              <li>Application information is sent only to the configured hiring recipient.</li>
              <li>Contact the Tea House if you need an alternative application method.</li>
            </ul>
          </aside>

          <div className="application-submit">
            <div className="application-verification" tabIndex="-1">
              <FormVerification
                verificationRef={verificationRef}
                onChange={(token) => {
                  setVerificationToken(token);
                  if (token) {
                    setVerificationError('');
                    setVerificationUnavailable(false);
                  }
                }}
                onExpired={() => {
                  setVerificationToken('');
                  setVerificationUnavailable(false);
                  setVerificationError('Verification expired. Please complete it again.');
                }}
                onError={() => {
                  setVerificationToken('');
                  setVerificationUnavailable(true);
                  setVerificationError('');
                }}
              />
              {!verificationToken && !verificationError && !verificationUnavailable ? (
                <p className="application-field-hint">Complete verification to enable the Submit Application button.</p>
              ) : null}
              {verificationError ? <p className="application-field-error" role="alert">{verificationError}</p> : null}
            </div>
            <button className="page-button" type="submit" disabled={isSubmitting || !verificationToken}>
              {isSubmitting ? 'Submitting application…' : 'Submit Application'}
            </button>
            <div
              ref={statusRef}
              className={`application-status is-${status.type}`}
              role={status.type === 'success' ? 'status' : 'alert'}
              aria-live="polite"
              tabIndex={status.type === 'success' ? '-1' : undefined}
            >
              {status.message ? <p>{status.message}</p> : null}
              {status.requestId && status.type !== 'success' ? <p>Request ID: {status.requestId}</p> : null}
            </div>
          </div>
        </form>
      </section>

      <section className="application-help page-section">
        <div><p className="page-eyebrow">Need another way to apply?</p><h2>We’re happy to help.</h2></div>
        <div>
          <p>Contact 1890 Tea House if you need an alternative application method or have a question about this form.</p>
          <a href={business.phoneHref}>{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <Link className="page-text-link" to="/contact">Visit contact information</Link>
        </div>
      </section>
    </PageShell>
  );
}
