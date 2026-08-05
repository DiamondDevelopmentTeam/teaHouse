import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from './components/PageShell.jsx';
import OptimizedImage from './components/OptimizedImage.jsx';
import FormVerification from './components/FormVerification.jsx';
import { business, businessAddress } from './data/business.js';
import { eventStatus } from './data/events.js';
import { contentService } from './services/contentService.js';
import {
  FORM_TYPES,
  FormSubmissionError,
  submitForm,
} from './services/formSubmission.ts';

import building from './assets/images/building.webp';
import charcuterieBoard from './assets/images/charcuterie-board.webp';
import teaHouseBanner from './assets/images/teaHouseBanner.webp';
import teaSandwiches from './assets/images/tea-sandwiches.webp';
import interior from './assets/images/migrated/about/interior.webp';
import patio from './assets/images/migrated/about/patio.webp';
import teaServiceFeature from './assets/images/migrated/gallery/33.webp';

const imageLibrary = {
  building: { src: building, alt: 'The 1890 Tea House exterior and patio', width: 1536, height: 1024 },
  board: { src: charcuterieBoard, alt: 'A charcuterie board prepared for sharing', width: 1442, height: 907 },
  banner: { src: teaHouseBanner, alt: 'Wine and a charcuterie board arranged on a light table', width: 1442, height: 907 },
  sandwiches: { src: teaSandwiches, alt: 'Classic tea sandwiches beside a floral tea service', width: 376, height: 265 },
  service: { src: teaServiceFeature, alt: 'Floral teapots and a teacup arranged for service', width: 800, height: 1422 },
  interior: { src: interior, alt: 'The warm interior of 1890 Tea House', width: 1442, height: 903 },
};

const siteUrl = 'https://1890teahouse.com';

function upsertMeta(selector, attributes) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.append(tag);
  }
  Object.entries(attributes).forEach(([name, value]) => tag.setAttribute(name, value));
}

export function Meta({ title, description, path = '/', image = building, schema = [] }) {
  useEffect(() => {
    const pageTitle = title.includes('1890 Tea House') ? title : `${title} | 1890 Tea House`;
    const canonicalUrl = `${siteUrl}${path === '/' ? '/' : path}`;
    const socialImage = new URL(image, window.location.origin).href;
    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: path.startsWith('/journal/') ? 'article' : 'website' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImage });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImage });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;

    document.querySelectorAll('script[data-route-schema]').forEach((node) => node.remove());
    const restaurantSchema = {
      '@context': 'https://schema.org',
      '@type': ['Restaurant', 'LocalBusiness'],
      name: business.name,
      description: business.description,
      url: siteUrl,
      telephone: business.phone,
      email: business.email,
      image: socialImage,
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address.street,
        addressLocality: business.address.locality,
        addressRegion: business.address.region,
        postalCode: business.address.postalCode,
        addressCountry: business.address.country,
      },
      openingHoursSpecification: business.hours
        .filter(({ opens }) => opens)
        .map(({ days, opens, closes }) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: days,
          opens,
          closes,
        })),
      sameAs: business.socials.map(({ href }) => href),
    };
    [restaurantSchema, ...schema].forEach((data) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.routeSchema = 'true';
      script.textContent = JSON.stringify(data);
      document.head.append(script);
    });
    return () => document.querySelectorAll('script[data-route-schema]').forEach((node) => node.remove());
  }, [description, image, path, schema, title]);
  return null;
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${siteUrl}${path}`,
    })),
  };
}

function PageHero({ eyebrow, title, intro, image = 'banner', actions, className = '' }) {
  const media = typeof image === 'string' ? imageLibrary[image] : image;
  const [mediaAvailable, setMediaAvailable] = useState(Boolean(media?.src));

  useEffect(() => {
    setMediaAvailable(Boolean(media?.src));
  }, [media?.src]);

  return (
    <section className={`page-hero${mediaAvailable ? '' : ' page-hero--text'}${className ? ` ${className}` : ''}`}>
      <div className="page-hero__copy">
        <p className="page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {mediaAvailable ? (
        <div className="page-hero__media">
          <OptimizedImage {...media} eager sizes="(max-width: 900px) 100vw, 56vw" onMissing={() => setMediaAvailable(false)} />
        </div>
      ) : null}
    </section>
  );
}

function ReservationsHero() {
  return (
    <section className="reservations-hero">
      <div className="reservations-hero__inner">
        <div className="reservations-hero__copy">
          <p className="page-eyebrow">Reservations</p>
          <h1>Choose the gathering you have in mind.</h1>
          <p>Settle into a cozy Tea Room or the welcoming patio for a birthday, catch-up, small gathering, or an unhurried pot of tea.</p>
          <nav className="reservations-hero__actions" aria-label="Reservation options">
            <ExternalLink className="page-button" href={business.reservationUrl}>Reserve a Table</ExternalLink>
            <Link className="page-button reservations-hero__secondary" to="/tea-rooms">Reserve a Tea Room</Link>
            <Link className="page-text-link" to="/reservations#large-party">Plan a Gathering for 12+</Link>
          </nav>
        </div>
        <figure className="reservations-hero__media">
          <OptimizedImage
            src={imageLibrary.service.src}
            alt={imageLibrary.service.alt}
            width={imageLibrary.service.width}
            height={imageLibrary.service.height}
            eager
            sizes="(max-width: 900px) calc(100vw - 3rem), 38rem"
          />
        </figure>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="page-section-title">
      <p className="page-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

function CTA() {
  return (
    <section className="page-cta">
      <p className="page-eyebrow">Make it an occasion</p>
      <h2>Tea tastes better when there is time for it.</h2>
      <div className="page-actions">
        <a className="page-button" href={business.reservationUrl} target="_blank" rel="noreferrer">
          Reserve for 1–11 guests <span className="sr-only">(opens in a new tab)</span>
        </a>
        <Link className="page-text-link" to="/reservations#large-party">Plan for 12+</Link>
      </div>
    </section>
  );
}

function ExternalLink({ href, children, className = '' }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Modal({ children, label, onClose, onPrevious, onNext }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious?.();
      if (event.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, onNext, onPrevious]);

  return (
    <div className="page-lightbox" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <button ref={closeRef} className="page-lightbox__close" type="button" onClick={onClose} aria-label="Close viewer">×</button>
      {onPrevious ? <button className="page-lightbox__previous" type="button" onClick={onPrevious} aria-label="Previous image">←</button> : null}
      {children}
      {onNext ? <button className="page-lightbox__next" type="button" onClick={onNext} aria-label="Next image">→</button> : null}
    </div>
  );
}

export function AboutPage() {
  return (
    <PageShell>
      <Meta title="About" description="Discover the story, historic setting, and hospitality behind 1890 Tea House in downtown Ocala." path="/about" image={interior} schema={[breadcrumbSchema([['Home', '/'], ['About', '/about']])]} />
      <PageHero eyebrow="Our story" title="A taste of elegance, inspired by 1890." intro="Created with one simple vision: to bring people together over a cup of tea, something delicious, and a moment of pause in the heart of downtown Ocala." image="interior" />
      <section className="page-section page-split">
        <SectionTitle eyebrow="A slower rhythm" title="Community, conversation, and connection.">
          Our name reflects the charm of a bygone era, when conversation and connection were treasured. Today, we carry that spirit forward.
        </SectionTitle>
        <div className="page-prose">
          <p>Thoughtfully prepared small plates, freshly baked desserts, curated charcuterie, and an extensive drink menu make 1890 a place for a light lunch, an afternoon pot, or a celebration.</p>
          <p>Whether you are hosting friends or taking a quiet break, elegance, comfort, and flavor come together without feeling formal.</p>
        </div>
      </section>
      <section className="page-section page-story-grid">
        <OptimizedImage src={patio} alt="The black, white, and pink Tea House and patio" width={1200} height={1600} sizes="(max-width: 800px) 100vw, 46vw" />
        <div className="page-prose">
          <p className="page-eyebrow">Rooted in history</p>
          <h2>A landmark setting with a fresh chapter.</h2>
          <p>1890 Tea House is located inside the Diamond Suites Downtown Ocala, surrounded by history and character. Timeless architecture frames a modern interpretation of traditional tea service, while the outdoor patio feels like a small garden retreat.</p>
          <h2>For gatherings big and small.</h2>
          <p>Private Tea Rooms and outdoor spaces welcome bridal showers, birthdays, book clubs, business gatherings, and the everyday pleasure of meeting a friend.</p>
          <p>The experience pairs tea-house tradition with Ocala flavor: gourmet but approachable plates, boards, pastries, and gracious hospitality.</p>
        </div>
      </section>
      <CTA />
    </PageShell>
  );
}

export function MenusPage() {
  const menus = contentService.getMenus();
  const sections = contentService.getMenuSections();
  const [active, setActive] = useState(null);
  const activeIndex = active ? menus.findIndex(({ id }) => id === active.id) : -1;
  const move = (offset) => setActive(menus[(activeIndex + offset + menus.length) % menus.length]);
  return (
    <PageShell>
      <Meta title="Menus" description="Explore every current 1890 Tea House menu, including afternoon tea, lunch, charcuterie, tea, coffee, wine, and children’s selections." path="/menus" image={menus[0].image} schema={[breadcrumbSchema([['Home', '/'], ['Menus', '/menus']])]} />
      <PageHero eyebrow="From the kitchen" title="Simple. Fresh. Beautiful." intro="Our menus are designed to pair with tea, wine, coffee, or a sparkling refreshment—fresh ingredients, elegant flavors, and a touch of indulgence." image="sandwiches" />
      <section className="page-section">
        <SectionTitle eyebrow="Current menu boards" title="Open, enlarge, or download every menu.">
          Select a menu to view it at a readable size. Offerings and prices may change as seasonal specialties and new pairings arrive.
        </SectionTitle>
        <div className="page-menu-viewer-grid">
          {menus.map((menu) => (
            <article className="page-menu-document" key={menu.id}>
              <button type="button" onClick={() => setActive(menu)} aria-label={`Enlarge ${menu.title}`}>
                <OptimizedImage src={menu.image} alt={menu.imageAlt} width={menu.width} height={menu.height} sizes="(max-width: 620px) 90vw, 28vw" />
              </button>
              <div><h3>{menu.title}</h3><p>{menu.description}</p><ExternalLink href={menu.pdf}>Download PDF</ExternalLink></div>
            </article>
          ))}
        </div>
      </section>
      <section className="page-section">
        <SectionTitle eyebrow="At a glance" title="Current items and prices." />
        <div className="page-menu-sections">
          {sections.map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              {section.items.map(([name, price]) => <div className="page-menu-row" key={name}><strong>{name}</strong><i /><span>{price}</span></div>)}
              {section.note ? <p className="page-menu-note">{section.note}</p> : null}
            </article>
          ))}
        </div>
        <p className="page-allergy-note"><strong>Food allergy notice:</strong> {contentService.getAllergyNotice()}</p>
      </section>
      {active ? (
        <Modal label={`${active.title} menu viewer`} onClose={() => setActive(null)} onPrevious={() => move(-1)} onNext={() => move(1)}>
          <figure className="page-lightbox__figure page-lightbox__figure--menu">
            <img src={active.image} alt={active.imageAlt} width={active.width} height={active.height} />
            <figcaption>{active.title} · Use arrow keys for other menus</figcaption>
          </figure>
        </Modal>
      ) : null}
      <CTA />
    </PageShell>
  );
}

export function EventsPage() {
  const events = contentService.getEvents();
  const eventSchemas = events.map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.start,
    endDate: event.end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: event.description,
    image: new URL(event.image, window.location.origin).href,
    location: { '@type': 'Place', name: business.name, address: businessAddress },
    offers: { '@type': 'Offer', description: event.offer, url: `${siteUrl}/events` },
  }));
  return (
    <PageShell>
      <Meta title="Events" description="See current public events and plan a private celebration at 1890 Tea House in downtown Ocala." path="/events" image={events[0].image} schema={[...eventSchemas, breadcrumbSchema([['Home', '/'], ['Events', '/events']])]} />
      <PageHero eyebrow="Events and catering" title="Bring the occasion. We’ll set the scene." intro="From bridal showers and birthdays to book clubs and business meetings, our Tea Rooms and patio make gatherings warm, elegant, and memorable." image={imageLibrary.board} actions={<Link className="page-button" to="/reservations#large-party">Plan a private event</Link>} />
      <section className="page-section">
        <SectionTitle eyebrow="Public events" title="Around the tea table." />
        <div className="page-events-grid">
          {events.map((event) => (
            <article className="page-event-card" key={event.id}>
              <OptimizedImage src={event.image} alt={event.imageAlt} width={event.width} height={event.height} sizes="(max-width: 800px) 100vw, 45vw" />
              <div>
                <span className="page-status">{eventStatus(event)}</span>
                <p>{event.dateDisplay} · {event.timeDisplay}</p>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <dl><div><dt>Location</dt><dd>{event.location}</dd></div><div><dt>Special</dt><dd>{event.offer}</dd></div></dl>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="page-section page-note"><h2>Private occasions and catering</h2><p>Host a bridal shower, birthday, book club, business gathering, or other celebration in a Tea Room or on the patio. Tea sandwiches, charcuterie, desserts, and tea service can also help make an off-site gathering feel distinctly 1890.</p></section>
      <CTA />
    </PageShell>
  );
}

function SubmissionStatus({ status }) {
  const isError = status.type === 'validation-error' || status.type === 'submission-error';

  return (
    <p
      className={`page-form-status is-${status.type}`}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
    >
      {status.type === 'submission-error' ? (
        <>
          We could not send your request. Your information is still in the form.
          Please try again, call <a href={business.phoneHref}>{business.phone}</a>, or
          email <a href={`mailto:${business.email}`}>{business.email}</a>.
          {status.requestId ? ` Reference: ${status.requestId}.` : ''}
        </>
      ) : (
        <>
          {status.message}
          {status.type === 'success' && status.requestId
            ? ` Reference: ${status.requestId}.`
            : ''}
        </>
      )}
    </p>
  );
}

function submissionErrorStatus(error) {
  return {
    type: error instanceof FormSubmissionError && error.kind === 'validation'
      ? 'validation-error'
      : 'submission-error',
    message: error instanceof Error ? error.message : 'Your request could not be sent.',
    requestId: error instanceof FormSubmissionError ? error.requestId : '',
  };
}

export function LargePartyForm() {
  const verificationRef = useRef(null);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState({ type: 'idle', message: '', requestId: '' });
  const [verificationToken, setVerificationToken] = useState('');
  const isSubmitting = status.type === 'submitting';

  const resetVerification = () => {
    verificationRef.current?.reset();
    setVerificationToken('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (submittingRef.current || isSubmitting) return;

    setStatus({ type: 'validating', message: 'Checking your request…', requestId: '' });
    if (!form.reportValidity()) {
      setStatus({
        type: 'validation-error',
        message: 'Please complete all required fields.',
        requestId: '',
      });
      return;
    }

    if (!verificationToken) {
      setStatus({
        type: 'validation-error',
        message: 'Please complete the verification before sending.',
        requestId: '',
      });
      return;
    }

    const formData = new FormData(form);
    const inquiryCategory = String(formData.get('occasion') || '').trim();
    const eventCategories = new Set(['Wedding event', 'Private event']);
    const payload = {
      formType: eventCategories.has(inquiryCategory)
        ? FORM_TYPES.EVENT
        : FORM_TYPES.RESERVATION,
      websiteName: '1890 Tea House',
      name: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      preferredDate: String(formData.get('date') || '').trim(),
      preferredTime: String(formData.get('time') || '').trim(),
      guestCount: String(formData.get('guests') || '').trim(),
      inquiryCategory,
      message: String(formData.get('message') || '').trim(),
      preOrders: formData.getAll('preOrders').map(String),
      policyAgreement: formData.get('policyAgreement') === 'Agreed',
      website: String(formData.get('website') || '').trim(),
      recaptchaToken: verificationToken,
      pageUrl: window.location.href,
    };

    submittingRef.current = true;
    setStatus({ type: 'submitting', message: 'Sending your request…', requestId: '' });
    try {
      const result = await submitForm(payload);
      setStatus({
        type: 'success',
        message: 'Thank you. Your request has been sent to the Tea House team.',
        requestId: result.requestId,
      });
      form.reset();
      resetVerification();
    } catch (error) {
      resetVerification();
      setStatus(submissionErrorStatus(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <form className="page-form page-form--large" onSubmit={handleSubmit}>
      <label>Full name<input name="fullName" autoComplete="name" maxLength="120" required /></label>
      <label>Phone<input type="tel" name="phone" autoComplete="tel" minLength="7" maxLength="40" required /></label>
      <label>Email<input type="email" name="email" autoComplete="email" maxLength="254" required /></label>
      <label>Requested date<input type="date" name="date" required /></label>
      <label>Requested time<input type="time" name="time" required /></label>
      <label>Number of guests<input type="number" name="guests" min="12" max="22" required /></label>
      <label>Occasion or reservation type<select name="occasion" defaultValue="" required><option value="" disabled>Select one</option><option>Tea Room</option><option>Wedding event</option><option>Private event</option><option>Birthday</option><option>Book club</option><option>Business gathering</option><option>Other</option></select></label>
      <fieldset><legend>Optional pre-order interests</legend>
        {['Charcuterie boards', 'Tea sandwiches', 'Desserts', 'Tea service for the table'].map((item) => <label className="page-check" key={item}><input type="checkbox" name="preOrders" value={item} />{item}</label>)}
      </fieldset>
      <label className="page-form-wide">Message<textarea name="message" rows="6" maxLength="5000" required placeholder="Tell us about the occasion, seating preference, dietary needs, or other requests." /></label>
      <label className="page-check page-form-wide"><input type="checkbox" name="policyAgreement" value="Agreed" required />I have read and agree to the large-party policies shown on this page.</label>
      <div className="page-form-honeypot" aria-hidden="true">
        <label>Website<input name="website" type="text" tabIndex="-1" autoComplete="off" /></label>
      </div>
      <FormVerification
        verificationRef={verificationRef}
        onChange={(token) => {
          setVerificationToken(token);
          if (token) setStatus({ type: 'idle', message: '', requestId: '' });
        }}
        onExpired={() => {
          resetVerification();
          setStatus({
            type: 'validation-error',
            message: 'Verification expired. Please complete it again.',
            requestId: '',
          });
        }}
        onError={() => {
          resetVerification();
          setStatus({
            type: 'validation-error',
            message: 'Verification could not load. Please try again.',
            requestId: '',
          });
        }}
      />
      <button className="page-button" type="submit" disabled={isSubmitting || !verificationToken}>
        {isSubmitting ? 'Sending…' : 'Send large-party request'}
      </button>
      <SubmissionStatus status={status} />
    </form>
  );
}

export function ReservationsPage() {
  return (
    <PageShell>
      <Meta title="Reservations" description="Reserve at 1890 Tea House, review large-party policies, and request Tea Room or patio seating for groups of 12 or more." path="/reservations" image={teaServiceFeature} schema={[breadcrumbSchema([['Home', '/'], ['Reservations', '/reservations']])]} />
      <ReservationsHero />
      <section className="page-section page-large-party" id="large-party">
        <div>
          <SectionTitle eyebrow="Groups of 12 or more" title="Plan the table together.">
            Seating may be arranged in a Tea Room or on the outdoor patio depending on availability. Special requests are welcome.
          </SectionTitle>
          <h3>Pre-order options</h3>
          <ul><li>Charcuterie boards</li><li>Tea sandwiches</li><li>Desserts</li><li>Tea service for the table</li></ul>
          <h3>Large-party policies</h3>
          <ul className="page-policy-list">
            <li>Tea Room reservations are required.</li>
            <li>Parties are seated once all members have arrived.</li>
            <li>Please cancel as soon as you know you cannot make your reserved time.</li>
            <li>Parties of 15 or more receive an automatic 20% gratuity.</li>
            <li>A $200 nonrefundable deposit is required for parties of 15 or more and is applied to the final bill.</li>
            <li>Each large-party guest must order at least one food item and one drink item.</li>
            <li>For 15 or more guests, call <a href={business.phoneHref}>{business.phone}</a> to confirm the requested date and time can be accommodated.</li>
          </ul>
        </div>
        <LargePartyForm />
      </section>
    </PageShell>
  );
}

export function TeaRoomsPage() {
  const rooms = contentService.getTeaRooms();
  return (
    <PageShell>
      <Meta title="Tea Rooms" description="Explore private Tea Rooms and patio gathering spaces at 1890 Tea House." path="/tea-rooms" image={rooms[0].image} schema={[breadcrumbSchema([['Home', '/'], ['Tea Rooms', '/tea-rooms']])]} />
      <PageHero eyebrow="Tea Rooms" title="Experience the charm of 1890." intro="Step into a place where tea time becomes an experience. Every room invites guests to slow down, sip, savor, and enjoy a timeless tradition." image={{ src: rooms[0].image, alt: rooms[0].imageAlt, width: rooms[0].width, height: rooms[0].height }} actions={<Link className="page-button" to="/reservations">Reserve a room</Link>} />
      <section className="page-section">
        <SectionTitle eyebrow="Gather your way" title="Private rooms, cozy spaces, and a welcoming patio.">
          Meet friends, celebrate a milestone, host a book club or business gathering, or simply take a quiet break.
        </SectionTitle>
        <div className="page-room-grid">
          {rooms.map((room) => <article key={room.id}><OptimizedImage src={room.image} alt={room.imageAlt} width={room.width} height={room.height} sizes="(max-width: 700px) 100vw, 32vw" /><div><h2>{room.label}</h2><p>{room.description}</p><ul>{room.uses.map((use) => <li key={use}>{use}</li>)}</ul><Link className="page-text-link" to="/reservations">Reservation options →</Link></div></article>)}
        </div>
        <p className="page-source-note">The source site does not publish individual room names, capacities, pricing, or guaranteed availability, so none are implied here.</p>
      </section>
      <CTA />
    </PageShell>
  );
}

export function NewsPage() {
  const news = contentService.getNews();
  return (
    <PageShell>
      <Meta title="News" description="Read all current press coverage and announcements about 1890 Tea House." path="/news" image={news[0].image} schema={[breadcrumbSchema([['Home', '/'], ['News', '/news']])]} />
      <PageHero eyebrow="News and press" title="1890 in the community." intro="Stories from local publications about the house, the menu, and a new gathering place in downtown Ocala." image="building" />
      <section className="page-section page-press-grid">
        {news.map((item) => <article key={item.href}><div className="page-press-media"><OptimizedImage src={item.image} alt={item.imageAlt} width={item.width} height={item.height} sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 33vw" /></div><div className="page-press-content"><p>{item.publication} · <time dateTime={item.date}>{item.dateDisplay}</time></p><h2>{item.headline}</h2><p>{item.summary}</p><ExternalLink href={item.href}>Read at {item.publication}</ExternalLink></div></article>)}
      </section>
      <CTA />
    </PageShell>
  );
}

export function FAQPage() {
  const faqs = contentService.getFaqs();
  const [open, setOpen] = useState(0);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };
  return (
    <PageShell>
      <Meta title="FAQs" description="Answers about reservations, events, dietary needs, parking, alcohol, and visiting 1890 Tea House." path="/faqs" image={teaSandwiches} schema={[schema, breadcrumbSchema([['Home', '/'], ['FAQs', '/faqs']])]} />
      <PageHero eyebrow="Good to know" title="Before you visit." intro="Answers to the questions guests ask most often. The Tea House team is also happy to help by phone or email." image="sandwiches" />
      <section className="page-section page-faq-list">
        {faqs.map(({ question, answer }, index) => {
          const expanded = open === index;
          return <article key={question} className={expanded ? 'is-open' : ''}><h2><button type="button" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(expanded ? -1 : index)}><span className="page-faq-number">{String(index + 1).padStart(2, '0')}</span><span className="page-faq-question">{question}</span><i aria-hidden="true" /></button></h2><div id={`faq-answer-${index}`} hidden={!expanded}><p>{answer}</p></div></article>;
        })}
      </section>
      <CTA />
    </PageShell>
  );
}

export function JournalPage() {
  const posts = contentService.getJournalPosts();
  return (
    <PageShell>
      <Meta title="Tea House Journal" description="Read every 1890 Tea House story about tea culture, Ocala dining, celebrations, and timeless rituals." path="/journal" image={posts[0].image} schema={[breadcrumbSchema([['Home', '/'], ['Journal', '/journal']])]} />
      <PageHero eyebrow="Tea House Journal" title="Stories steeped in tradition." intro="Notes on tea culture, hospitality, gatherings, and the rituals that make time around a table feel special." image="service" className="journal-hero" />
      <section className="page-section page-journal-grid">
        {posts.map((post) => <article key={post.slug}><Link to={`/journal/${post.slug}`}><OptimizedImage src={post.image} alt={post.imageAlt} width={post.width} height={post.height} sizes="(max-width: 700px) 100vw, 31vw" /><div><time dateTime={post.date}>{post.dateDisplay}</time><h2>{post.title}</h2><p>{post.excerpt}</p><strong>Read article →</strong></div></Link></article>)}
      </section>
      <CTA />
    </PageShell>
  );
}

export function JournalArticlePage() {
  const { slug } = useParams();
  const posts = contentService.getJournalPosts();
  const post = contentService.getJournalPost(slug);
  if (!post) return <NotFoundPage />;
  const index = posts.findIndex((item) => item.slug === slug);
  const previous = posts[index + 1];
  const next = posts[index - 1];
  const related = posts.filter((item) => item.slug !== slug).slice(0, 3);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    image: new URL(post.image, window.location.origin).href,
    author: { '@type': 'Organization', name: business.name },
    publisher: { '@type': 'Organization', name: business.name },
    mainEntityOfPage: `${siteUrl}/journal/${post.slug}`,
  };
  return (
    <PageShell>
      <Meta title={post.title} description={post.excerpt} path={`/journal/${post.slug}`} image={post.image} schema={[schema, breadcrumbSchema([['Home', '/'], ['Journal', '/journal'], [post.title, `/journal/${post.slug}`]])]} />
      <article className="journal-article">
        <header><p className="page-eyebrow">Tea House Journal</p><h1>{post.title}</h1><time dateTime={post.date}>{post.dateDisplay}</time></header>
        <OptimizedImage className="journal-article__hero" src={post.image} alt={post.imageAlt} width={post.width} height={post.height} eager sizes="(max-width: 900px) 100vw, 1100px" />
        <div className="journal-article__body">
          {post.sections.map((section, sectionIndex) => <section key={section.heading || sectionIndex}>{section.heading ? <h2>{section.heading}</h2> : null}{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.list ? <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}
        </div>
        <nav className="journal-pagination" aria-label="Journal article navigation">
          {previous ? <Link to={`/journal/${previous.slug}`}><span>Previous</span>{previous.title}</Link> : <span />}
          {next ? <Link to={`/journal/${next.slug}`}><span>Next</span>{next.title}</Link> : <span />}
        </nav>
      </article>
      <section className="page-section"><SectionTitle eyebrow="Keep reading" title="Related stories." /><div className="page-related-grid">{related.map((item) => <Link key={item.slug} to={`/journal/${item.slug}`}><time dateTime={item.date}>{item.dateDisplay}</time><h3>{item.title}</h3></Link>)}</div></section>
      <CTA />
    </PageShell>
  );
}

export function GalleryPage() {
  const allImages = contentService.getGalleryImages();
  const categories = contentService.getGalleryCategories();
  const [category, setCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(-1);
  const images = useMemo(() => category === 'All' ? allImages : allImages.filter((item) => item.category === category), [allImages, category]);
  const active = images[activeIndex];
  const move = (offset) => setActiveIndex((activeIndex + offset + images.length) % images.length);
  return (
    <PageShell>
      <Meta title="Gallery" description="Explore Tea Rooms, food, tea service, events, the patio, and private gatherings at 1890 Tea House." path="/gallery" image={allImages[0].src} schema={[breadcrumbSchema([['Home', '/'], ['Gallery', '/gallery']])]} />
      <PageHero eyebrow="Gallery" title="A glimpse inside 1890." intro="Tea Rooms, artful plates, private gatherings, and the historic house that gives every visit its sense of place." image="interior" />
      <section className="page-section">
        <div className="page-filter" aria-label="Filter gallery">
          {categories.map((item) => <button type="button" className={item === category ? 'is-active' : ''} aria-pressed={item === category} key={item} onClick={() => { setCategory(item); setActiveIndex(-1); }}>{item}</button>)}
        </div>
        <div className="page-gallery-grid">
          {images.map((item, index) => <button type="button" key={`${item.src}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`Open image: ${item.caption}`}><OptimizedImage src={item.src} alt={item.alt} width={item.width} height={item.height} sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw" /><span>{item.caption}</span></button>)}
        </div>
      </section>
      {active ? <Modal label="Gallery image viewer" onClose={() => setActiveIndex(-1)} onPrevious={() => move(-1)} onNext={() => move(1)}><figure className="page-lightbox__figure"><img src={active.src} alt={active.alt} width={active.width} height={active.height} /><figcaption>{active.caption}<span>{activeIndex + 1} / {images.length}</span></figcaption></figure></Modal> : null}
      <CTA />
    </PageShell>
  );
}

export function ContactForm() {
  const verificationRef = useRef(null);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState({ type: 'idle', message: '', requestId: '' });
  const [verificationToken, setVerificationToken] = useState('');
  const isSubmitting = status.type === 'submitting';

  const resetVerification = () => {
    verificationRef.current?.reset();
    setVerificationToken('');
  };

  const handleVerificationExpired = () => {
    resetVerification();
    setStatus({
      type: 'validation-error',
      message: 'Verification expired. Please complete it again.',
      requestId: '',
    });
  };

  const handleVerificationError = () => {
    resetVerification();
    setStatus({
      type: 'validation-error',
      message: 'Verification could not load. Please try again.',
      requestId: '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (submittingRef.current || isSubmitting) return;
    setStatus({ type: 'validating', message: 'Checking your inquiry…', requestId: '' });
    if (!form.reportValidity()) {
      setStatus({
        type: 'validation-error',
        message: 'Please complete all required fields.',
        requestId: '',
      });
      return;
    }

    if (!verificationToken) {
      setStatus({
        type: 'validation-error',
        message: 'Please complete the verification before sending.',
        requestId: '',
      });
      return;
    }

    const formData = new FormData(form);
    const inquiryCategory = String(formData.get('inquiryType') || '').trim();
    const eventCategories = new Set(['Large party', 'Private event', 'Catering']);
    const payload = {
      formType: eventCategories.has(inquiryCategory)
        ? FORM_TYPES.EVENT
        : inquiryCategory === 'General question'
          ? FORM_TYPES.GENERAL
          : FORM_TYPES.CONTACT,
      websiteName: '1890 Tea House',
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      preferredDate: String(formData.get('preferredDate') || '').trim(),
      guestCount: String(formData.get('guestCount') || '').trim(),
      inquiryCategory,
      message: String(formData.get('message') || '').trim(),
      website: String(formData.get('website') || '').trim(),
      recaptchaToken: verificationToken,
      pageUrl: window.location.href,
    };

    submittingRef.current = true;
    setStatus({ type: 'submitting', message: 'Sending your inquiry…', requestId: '' });

    try {
      const result = await submitForm(payload);
      setStatus({
        type: 'success',
        message: result.message,
        requestId: result.requestId,
      });
      form.reset();
      resetVerification();
    } catch (error) {
      resetVerification();
      setStatus(submissionErrorStatus(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return <form className="page-form" onSubmit={handleSubmit}>
    <label>Name<input name="name" autoComplete="name" maxLength="120" required /></label>
    <label>Email<input type="email" name="email" autoComplete="email" maxLength="254" required /></label>
    <label>Phone<input type="tel" name="phone" autoComplete="tel" minLength="7" maxLength="40" required /></label>
    <label>Preferred date<input type="date" name="preferredDate" required /></label>
    <label>Guest count<input type="number" name="guestCount" min="1" max="500" inputMode="numeric" required /></label>
    <label className="page-form-wide">What can we help with?<select name="inquiryType" defaultValue="General question" required><option>General question</option><option>Large party</option><option>Private event</option><option>Catering</option><option>Media inquiry</option></select></label>
    <label className="page-form-wide">Message<textarea name="message" rows="6" maxLength="5000" required /></label>
    <div className="page-form-honeypot" aria-hidden="true">
      <label>Website<input name="website" type="text" tabIndex="-1" autoComplete="off" /></label>
    </div>
    <FormVerification
      verificationRef={verificationRef}
      onChange={(token) => {
        setVerificationToken(token);
        if (token) setStatus({ type: 'idle', message: '', requestId: '' });
      }}
      onExpired={handleVerificationExpired}
      onError={handleVerificationError}
    />
    <button
      className="page-button"
      type="submit"
      disabled={isSubmitting || !verificationToken}
    >
      {isSubmitting ? 'Sending…' : 'Send Inquiry'}
    </button>
    <SubmissionStatus status={status} />
  </form>;
}

export function ContactPage() {
  return (
    <PageShell>
      <Meta title="Contact" description="Contact 1890 Tea House, get directions, see current hours, or send an event inquiry." path="/contact" image={building} schema={[breadcrumbSchema([['Home', '/'], ['Contact', '/contact']])]} />
      <PageHero eyebrow="Contact" title="Come take your time." intro="Plan a visit, ask a question, or tell the team what you have in mind for your next gathering." image="building" />
      <section className="page-section page-contact-layout">
        <div className="page-contact-details">
          <h2>Visit 1890</h2>
          <address>{business.address.street}<br />{business.address.locality}, {business.address.region} {business.address.postalCode}</address>
          <a href={business.phoneHref}>{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <dl>{business.hours.map(({ label, display }) => <div key={label}><dt>{label}</dt><dd>{display}</dd></div>)}</dl>
          <ExternalLink className="page-button" href={business.directionsUrl}>Get directions</ExternalLink>
          <div className="page-contact-links"><Link to="/reservations">Reservations</Link><Link to="/reservations#large-party">Event inquiries</Link></div>
          <div className="footer-socials">{business.socials.map(({ label, href }) => <ExternalLink key={href} href={href}>{label}</ExternalLink>)}</div>
        </div>
        <ContactForm />
      </section>
    </PageShell>
  );
}

export function CareersPage() {
  return (
    <PageShell>
      <Meta title="Careers" description="Learn about joining the warm, guest-focused team at 1890 Tea House and access the current application." path="/careers" image={interior} schema={[breadcrumbSchema([['Home', '/'], ['Careers', '/careers']])]} />
      <PageHero className="careers-hero" eyebrow="Join our team" title="Help us make every visit feel special." intro="1890 Tea House is building a team around gracious service, thoughtful food and drink, and a warm welcome in the heart of downtown Ocala." image="interior" />
      <section className="page-section page-split">
        <SectionTitle eyebrow="Work at 1890" title="Hospitality with heart.">
          The Tea House welcomes applicants who enjoy creating memorable guest experiences in a beautiful, fast-paced setting inside Diamond Suites Downtown Ocala.
        </SectionTitle>
        <div className="page-prose">
          <p>The current application asks about availability, weekend and holiday scheduling, customer-service and food-handling experience, POS familiarity, comfort carrying trays and standing for a shift, certifications, education, references, and work authorization.</p>
          <p>Resume upload and the complete employment certification remain in the current secure application workflow.</p>
          <Link className="page-button" to={business.applicationUrl}>Open the server application</Link>
        </div>
      </section>
      <section className="page-section page-note"><h2>Before you apply</h2><p>Have your employment history, availability, two references, certifications, and résumé ready. The application also includes consent for a background check and a signed accuracy certification.</p></section>
    </PageShell>
  );
}

export function LegalPage({ type }) {
  const privacy = type === 'privacy';
  return (
    <PageShell>
      <Meta title={privacy ? 'Privacy Policy' : 'Terms and Conditions'} description={`${privacy ? 'Privacy policy' : 'Terms and conditions'} for the 1890 Tea House website.`} path={privacy ? '/privacy' : '/terms'} image={building} schema={[breadcrumbSchema([['Home', '/'], [privacy ? 'Privacy' : 'Terms', privacy ? '/privacy' : '/terms']])]} />
      <section className="page-legal">
        <p className="page-eyebrow">Website information</p>
        <h1>{privacy ? 'Privacy Policy' : 'Terms and Conditions'}</h1>
        {privacy ? <>
          <p>1890 Tea House respects your privacy and is committed to protecting the information you choose to share.</p>
          <h2>Information we collect</h2><p>We may collect your name, email address, phone number, reservation or event details, and messages when you use a contact, reservation, or inquiry form.</p>
          <h2>How information is used</h2><p>Information is used to confirm reservations, respond to questions, manage event inquiries, and—when requested—send menu or event updates. 1890 Tea House does not sell, rent, or share personal information except when required by law.</p>
          <h2>Cookies and analytics</h2><p>The website may use basic cookies or analytics to understand traffic and improve the visitor experience. Third-party reservation, map, and social services have their own privacy practices.</p>
          <h2>Your choices</h2><p>You may unsubscribe from updates or request removal of your information by emailing <a href={`mailto:${business.email}`}>{business.email}</a>.</p>
        </> : <>
          <h2>Reservations</h2><p>Private Tea Rooms require advance booking. A deposit may be required and may be nonrefundable when a reservation is cancelled with less than 24 hours’ notice. Large-party requirements shown on the Reservations page also apply.</p>
          <h2>Menu and pricing</h2><p>Menu items and pricing may change seasonally. Applicable taxes and service fees may be added.</p>
          <h2>Allergies and dietary needs</h2><p>Please share allergies or dietary needs in advance. Although the team will do its best to accommodate requests, an allergen-free environment cannot be guaranteed.</p>
          <h2>Website content</h2><p>Text, imagery, branding, and other content on this website are owned by or licensed to 1890 Tea House and may not be reproduced without permission.</p>
          <h2>Limitation of liability</h2><p>1890 Tea House is not responsible for losses arising from reliance on website information, third-party services, or temporary website unavailability.</p>
          <h2>Contact</h2><p>Questions about these terms may be sent to <a href={`mailto:${business.email}`}>{business.email}</a>.</p>
        </>}
        <p><small>Last updated July 28, 2026.</small></p>
      </section>
    </PageShell>
  );
}

export function NotFoundPage() {
  return (
    <PageShell>
      <Meta title="Page Not Found" description="The requested 1890 Tea House page could not be found." path="/404" image={building} />
      <section className="page-not-found"><p className="page-eyebrow">404</p><h1>This page has gone out for tea.</h1><p>The link may be old, but the table is still waiting.</p><Link className="page-button" to="/">Return home</Link></section>
    </PageShell>
  );
}