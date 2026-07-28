import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './App.css';
import { business, navigation } from './data/business.js';
import { Meta } from './Pages.jsx';

import building from './assets/images/building.webp';
import cupOfFruits from './assets/images/cupOfFruits.jpg';
import diamondSuites from './assets/images/DiamondSuitesDownTownOcala.webp';
import tableOfTeaHouse from './assets/images/tableOfTeaHouse.jpg';
import teaHouseBanner from './assets/images/teaHouseBanner.webp';
import teaHouseLogo from './assets/images/TeaHouseLogo.webp';
import teaService from './assets/images/tea-service.webp';
import teaTime from './assets/images/teaTime.jpg';

const reservationLink = business.reservationUrl;
const menuLink = '/menus';
const largePartyLink = '/reservations#large-party';
const directionsLink = business.directionsUrl;

const primaryNav = [
  { label: 'About', to: '/about' },
  { label: 'Menus', to: '/menus' },
  { label: 'Tea Rooms', to: '/tea-rooms' },
  { label: 'Visit', to: '/contact' },
];

const fullNav = [{ label: 'Home', to: '/' }, ...navigation];

const allDayFavorites = [
  { name: 'Cucumber Sando', price: '$9' },
  { name: 'Hummus-Stuffed Mini Peppers', price: '$7' },
  { name: 'Turkey & Cheese Croissant or Muffin', price: '$11' },
];

const sweetFavorites = [
  { name: 'Mini Dessert Shooters', price: '$5' },
  { name: 'Cheesecake-Stuffed Strawberries', price: '$6' },
  { name: 'Tiramisu Truffles', price: '$7' },
];

const services = [
  ['01', 'Curated tea & coffee', 'Classic pours, matcha, chai, espresso, and more.'],
  ['02', 'Tea sandwiches & bites', 'Fresh, elegant plates for a light lunch or a leisurely afternoon.'],
  ['03', 'Charcuterie', 'Signature cups and boards sized for solo visits or shared tables.'],
  ['04', 'Pastries & desserts', 'A sweet finish, prepared with a little ceremony.'],
];

const faqs = [
  {
    question: 'Do I need a reservation?',
    answer:
      'Walk-ins are welcome. Reservations are recommended for private tea rooms and larger parties.',
  },
  {
    question: 'Can you accommodate dietary restrictions?',
    answer:
      'Please share dietary needs in advance and the team will do its best to accommodate them.',
  },
  {
    question: 'Can I host a private event?',
    answer:
      'Yes. Tea rooms and event options are available for celebrations, meetings, and other gatherings.',
  },
  {
    question: 'Do you serve alcohol?',
    answer:
      'Yes. Select wines and craft beverages are available alongside tea and coffee service.',
  },
  {
    question: 'Is parking available?',
    answer:
      'Yes. Ample parking is available in the Diamond Downtown Ocala parking area.',
  },
];

const socialLinks = business.socials;

function BrandMark({ compact = false, onClick }) {
  return (
    <Link
      className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}
      to="/"
      onClick={onClick}
      aria-label="1890 Tea House home"
    >
      <img src={teaHouseLogo} alt="1890 Tea House" width="820" height="402" />
    </Link>
  );
}

function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      <span />
    </span>
  );
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuCloseRef = useRef(null);

  useEffect(() => {
    let frame;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 32);
        document.documentElement.style.setProperty(
          '--hero-shift',
          `${Math.min(scrollTop * 0.055, 42)}px`,
        );
        frame = undefined;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuCloseRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="site-shell">
      <Meta
        title="1890 Tea House | Tea Room, Restaurant & Catering"
        description="Visit 1890 Tea House in downtown Ocala for curated teas, artful bites, private Tea Rooms, catering, and memorable gatherings."
        path="/"
        image={teaHouseBanner}
      />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-inner">
          <BrandMark compact={isScrolled} onClick={closeMenu} />

          <nav className="primary-nav" aria-label="Primary navigation">
            {primaryNav.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <Link className="header-reserve" to="/reservations">
              Reserve
            </Link>
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label="Open site menu"
            >
              <span>Menu</span>
              <span className="menu-toggle-lines" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        className={`menu-panel ${menuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!menuOpen}
      >
        <div className="menu-panel-top">
          <BrandMark onClick={closeMenu} />
          <button ref={menuCloseRef} className="menu-close" type="button" onClick={closeMenu}>
            Close <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="menu-panel-body">
          <p className="eyebrow">Explore 1890</p>
          <nav aria-label="Full navigation">
            {fullNav.map((item, index) => (
              <NavLink key={item.label} to={item.to} onClick={closeMenu}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="menu-panel-details">
            <p>{business.address.street}<br />{business.address.locality}, {business.address.region} {business.address.postalCode}</p>
            <p>Wednesday–Sunday<br /><a href={business.phoneHref}>{business.phone}</a></p>
          </div>
        </div>
      </div>

      <main id="main-content">
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-kicker">Tea room · Restaurant · Catering</p>
            <h1 id="hero-title">
              A beautiful reason
              <em>to linger.</em>
            </h1>
            <p className="hero-intro">
              Curated teas, artful bites, and private rooms in one of Ocala’s most distinctive historic settings.
            </p>
            <div className="hero-actions">
              <a className="button button--gold" href={reservationLink} target="_blank" rel="noreferrer">
                Reserve a table <Arrow />
              </a>
              <a className="text-link text-link--light" href="#menus">
                Explore the menu <Arrow />
              </a>
            </div>
            <div className="hero-facts" aria-label="Quick visit information">
              <div>
                <span>Visit</span>
                <p>Downtown Ocala, Florida</p>
              </div>
              <div>
                <span>Open</span>
                <p>Wednesday–Sunday</p>
              </div>
            </div>
          </div>

          <div className="hero-media" aria-label="1890 Tea House charcuterie presentation">
            <img
              className="hero-main-image"
              src={teaHouseBanner}
              alt="Wine and a charcuterie board arranged on a light table"
              width="1442"
              height="907"
              fetchPriority="high"
              decoding="async"
            />
            <div className="hero-image-label">
              <span>1890</span>
              <p>Tea with a sense of occasion</p>
            </div>
          </div>

          <a className="scroll-cue" href="#about">
            <span>Discover</span>
            <i aria-hidden="true" />
          </a>
        </section>

        <section id="about" className="story section-pad" aria-labelledby="story-title">
          <div className="story-heading" data-reveal>
            <p className="eyebrow">An everyday retreat</p>
            <h2 id="story-title">
              Historic character.
              <em>Modern hospitality.</em>
            </h2>
          </div>

          <div className="story-copy" data-reveal>
            <p className="story-lead">
              1890 Tea House is a place to slow the pace, share something delicious, and let conversation take its time.
            </p>
            <p>
              Set inside the historic Diamond Suites building, the tea house brings together thoughtfully selected drinks, delicate bites, private rooms, and a welcoming patio in the heart of Ocala.
            </p>
            <a className="text-link" href="#tea-rooms">
              Explore the experience <Arrow />
            </a>
          </div>

          <figure className="story-image image-reveal" data-reveal>
            <img
              src={building}
              alt="The black, white, and pink 1890 Tea House with its outdoor patio"
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>Since 1890</span>
              A landmark setting on Silver Springs Boulevard
            </figcaption>
          </figure>
        </section>

        <section id="menus" className="menu-section" aria-labelledby="menu-title">
          <div className="menu-heading section-pad" data-reveal>
            <p className="eyebrow eyebrow--gold">From the kitchen</p>
            <h2 id="menu-title">A menu made to wander through.</h2>
            <p>
              Pair your pot with something savory, something sweet, or a board for the whole table.
            </p>
          </div>

          <div className="menu-layout section-pad">
            <div className="menu-lists" data-reveal>
              <article className="menu-list">
                <div className="menu-list-title">
                  <span>01</span>
                  <h3>All-day favorites</h3>
                </div>
                {allDayFavorites.map((item) => (
                  <div className="menu-item" key={item.name}>
                    <h4>{item.name}</h4>
                    <i aria-hidden="true" />
                    <p>{item.price}</p>
                  </div>
                ))}
              </article>

              <article className="menu-list">
                <div className="menu-list-title">
                  <span>02</span>
                  <h3>Sweet finish</h3>
                </div>
                {sweetFavorites.map((item) => (
                  <div className="menu-item" key={item.name}>
                    <h4>{item.name}</h4>
                    <i aria-hidden="true" />
                    <p>{item.price}</p>
                  </div>
                ))}
              </article>

              <p className="menu-note">Selections and pricing may change with the season.</p>
              <Link className="button button--outline-light" to={menuLink}>
                View all menus <Arrow />
              </Link>
            </div>

            <figure className="menu-image image-reveal" data-reveal>
              <img
                src={cupOfFruits}
                alt="A signature 1890 Tea House charcuterie cup"
                width="667"
                height="1000"
                loading="lazy"
                decoding="async"
              />
              <figcaption>Signature charcuterie cup</figcaption>
            </figure>
          </div>

          <div className="service-ledger section-pad">
            {services.map(([number, title, description], index) => (
              <article key={number} data-reveal style={{ '--delay': `${index * 70}ms` }}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="tea-rooms" className="rooms section-pad" aria-labelledby="rooms-title">
          <div className="rooms-gallery" data-reveal>
            <figure className="rooms-image-main image-reveal">
              <img
                src={teaTime}
                alt="A private tea room with pink velvet seating and floral tea service"
                width="750"
                height="1000"
                loading="lazy"
                decoding="async"
              />
            </figure>
            <figure className="rooms-image-detail image-reveal">
              <img
                src={teaService}
                alt="A floral tea service arranged on a gold stand"
                width="361"
                height="395"
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>

          <div className="rooms-copy" data-reveal>
            <p className="eyebrow">Private tea rooms</p>
            <h2 id="rooms-title">
              Your room.
              <em>Your pace.</em>
            </h2>
            <p className="rooms-lead">
              Make an ordinary afternoon feel like an occasion, whether you are catching up with a friend or celebrating with the whole table.
            </p>
            <ul className="rooms-list">
              <li><span>01</span>Cozy, individually styled tea rooms</li>
              <li><span>02</span>Tea, desserts, sandwiches, and charcuterie</li>
              <li><span>03</span>Outdoor patio seating when available</li>
            </ul>
            <div className="rooms-actions">
              <a className="button button--ink" href={reservationLink} target="_blank" rel="noreferrer">
                Reserve for 1–11 guests <Arrow />
              </a>
              <Link className="text-link" to={largePartyLink}>
                Planning for 12+? <Arrow />
              </Link>
            </div>
          </div>
        </section>

        <section id="events" className="events" aria-labelledby="events-title">
          <div className="events-image image-reveal" data-reveal>
            <img
              src={tableOfTeaHouse}
              alt="A private table set with a floral tea service"
              width="750"
              height="1000"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="events-copy section-pad" data-reveal>
            <p className="eyebrow eyebrow--gold">Events & catering</p>
            <h2 id="events-title">Bring the occasion. We’ll set the scene.</h2>
            <p>
              From bridal showers and birthdays to book clubs, business lunches, and gatherings at home, 1890 brings a gracious touch to the table.
            </p>
            <div className="event-types">
              <article>
                <span>Gather here</span>
                <h3>Private celebrations</h3>
                <p>Tea rooms and patio spaces for meaningful moments, large or small.</p>
              </article>
              <article>
                <span>Bring 1890 to you</span>
                <h3>Catering</h3>
                <p>Tea sandwiches, charcuterie, pastries, and beverages for your gathering.</p>
              </article>
            </div>
            <div className="events-actions">
              <Link className="button button--gold" to={largePartyLink}>
                Start planning <Arrow />
              </Link>
              <a
                className="text-link text-link--light"
                href="https://www.facebook.com/profile.php?id=61582592901231"
                target="_blank"
                rel="noreferrer"
              >
                See public event news <Arrow />
              </a>
            </div>
          </div>
        </section>

        <section id="news" className="notes section-pad" aria-labelledby="notes-title">
          <div className="notes-heading" data-reveal>
            <p className="eyebrow eyebrow--gold">News & notes</p>
            <h2 id="notes-title">Around the tea table.</h2>
          </div>

          <div className="notes-grid">
            <article className="press-feature" data-reveal>
              <span>In the press · January 2026</span>
              <h3>1890 Tea House opens a new Ocala spot for afternoon tea and small plates.</h3>
              <p>Ocala-News introduced the tea house, its private rooms, patio, and menu to the community.</p>
              <a
                className="text-link"
                href="https://www.ocala-news.com/2026/01/21/1890-tea-house-opens-new-ocala-spot-for-charcuterie-afternoon-tea/"
                target="_blank"
                rel="noreferrer"
              >
                Read on Ocala-News <Arrow />
              </a>
            </article>

            <article className="press-feature press-feature--dark" data-reveal>
              <span>In the press · January 2026</span>
              <h3>Historic charm meets modern dining in downtown Ocala.</h3>
              <p>352today took a closer look at the tea service, menu, patio, and private room experience.</p>
              <a
                className="text-link text-link--light"
                href="https://352today.com/news/257752-352eats-1890-tea-house-merges-historic-charm-and-modern-dining-in-ocala/"
                target="_blank"
                rel="noreferrer"
              >
                Read on 352today <Arrow />
              </a>
            </article>
          </div>

          <div id="journal" className="journal" data-reveal>
            <div className="journal-title">
              <p className="eyebrow">From the blog</p>
              <h3>Stories steeped in tradition.</h3>
            </div>
            <Link to="/journal/why-tea-houses-are-having-a-moment-and-why-it-makes-perfect-sense">
              <span>June 29, 2026</span>
              <strong>Why Tea Houses Are Having a Moment</strong>
              <Arrow />
            </Link>
            <Link to="/journal/scones-clotted-cream-the-delicious-story-behind-a-timeless-pairing">
              <span>April 22, 2026</span>
              <strong>Scones & Clotted Cream: A Timeless Pairing</strong>
              <Arrow />
            </Link>
          </div>
        </section>

        <section id="faq" className="faq section-pad" aria-labelledby="faq-title">
          <div className="faq-intro" data-reveal>
            <p className="eyebrow">Good to know</p>
            <h2 id="faq-title">Before you visit.</h2>
            <p>Need something else? Call or email the tea house and the team will be happy to help.</p>
            <a className="text-link" href={`mailto:${business.email}`}>
              Ask a question <Arrow />
            </a>
          </div>
          <div className="faq-list" data-reveal>
            {faqs.map((item, index) => (
              <details key={item.question}>
                <summary>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {item.question}
                  <i aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contact" className="visit" aria-labelledby="visit-title">
          <div className="visit-media image-reveal" data-reveal>
            <img
              src={building}
              alt="1890 Tea House and its black-and-white umbrella patio"
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
            />
            <div className="visit-address">
              <span>Find us</span>
              <p>{business.address.street}<br />{business.address.locality}, {business.address.region} {business.address.postalCode}</p>
            </div>
          </div>

          <div id="location" className="visit-details section-pad" data-reveal>
            <p className="eyebrow eyebrow--gold">Come take your time</p>
            <h2 id="visit-title">Your table is waiting.</h2>

            <div className="visit-grid">
              <article>
                <span>Hours</span>
                <dl>
                  {business.hours.map(({ label, display }) => (
                    <div key={label}><dt>{label}</dt><dd>{display}</dd></div>
                  ))}
                </dl>
              </article>
              <article>
                <span>Contact</span>
                <a href={business.phoneHref}>{business.phone}</a>
                <a href={`mailto:${business.email}`}>{business.email}</a>
              </article>
            </div>

            <div className="visit-actions">
              <a className="button button--gold" href={directionsLink} target="_blank" rel="noreferrer">
                Get directions <Arrow />
              </a>
              <Link className="button button--outline-light" to="/reservations">
                Make a reservation <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-pad">
        <div className="footer-brand">
          <BrandMark />
          <img
            className="diamond-logo"
            src={diamondSuites}
            alt="Diamond Suites Downtown Ocala"
            width="1200"
            height="200"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="footer-nav">
          <p>Explore</p>
          {fullNav.slice(0, 6).map((item) => (
            item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.to}>{item.label}</Link>
            )
          ))}
        </div>

        <div className="footer-nav">
          <p>More</p>
          {fullNav.slice(6).map((item) => (
            <Link key={item.label} to={item.to}>{item.label}</Link>
          ))}
        </div>

        <div className="footer-visit">
          <p>Visit</p>
          <address>
            {business.address.street}<br />
            {business.address.locality}, {business.address.region} {business.address.postalCode}
          </address>
          <a href={business.phoneHref}>{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <div className="footer-socials" aria-label="Social media">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 1890 Tea House. All rights reserved.</p>
          <a href="#home">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </div>
  );
}

export default App;
