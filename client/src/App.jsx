import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import {
  business,
  footerNavigationGroups,
  navigation,
  primaryNavigation,
} from './data/business.js';
import { Meta } from './Pages.jsx';
import SiteLink from './components/SiteLink.jsx';
import useSiteMenu from './components/useSiteMenu.js';

import building from './assets/images/building.webp';
import cupOfFruits from './assets/images/cupOfFruits.jpg';
import diamondSuites from './assets/images/DiamondSuitesDownTownOcala.webp';
import interior from './assets/images/migrated/about/interior.webp';
import teaHouseBanner from './assets/images/teaHouseBanner.webp';
import teaHouseLogo from './assets/images/TeaHouseLogo.webp';
import teaService from './assets/images/tea-service.webp';
import teaTime from './assets/images/teaTime.jpg';

const reservationLink = business.reservationUrl;
const menuLink = '/menus';
const largePartyLink = '/reservations#large-party';
const directionsLink = business.directionsUrl;

const fullNav = [{ label: 'Home', to: '/', type: 'route' }, ...navigation];

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
  ['01', 'Tea & coffee', 'Classic pours, matcha, chai, espresso, and more for a quick cup or a longer stay.'],
  ['02', 'Sandwiches & bites', 'Light plates that work for lunch, afternoon tea, or something in between.'],
  ['03', 'Charcuterie', 'Signature cups and boards sized for solo visits, date nights, and shared tables.'],
  ['04', 'Pastries & desserts', 'A sweet finish to pair with the last pour from the pot.'],
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
    question: 'Can I plan a private gathering?',
    answer:
      'Private tea rooms and event options are available for celebrations, meetings, and other gatherings. Submit a large-party request so the team can help with the right space and details.',
  },
  {
    question: 'Does 1890 Tea House offer catering?',
    answer:
      'Catering is part of the current Tea House offering. Selections and arrangements vary, so send an inquiry to discuss your date, guest count, and menu needs.',
  },
  {
    question: 'How do I start an event inquiry?',
    answer:
      'Use the large-party request form for groups of 12 or more. Your plans are not confirmed until the Tea House follows up with availability and next steps.',
  },
  {
    question: 'Where can I find current menus and hours?',
    answer:
      'Use the Menus page for current listed selections and the Visit section for regular hours. Hours and offerings can change for holidays or special events, so contact the Tea House when timing is important.',
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

function SectionEyebrow({ children, tone = 'pink', className = '' }) {
  const classes = ['eyebrow', tone === 'gold' ? 'eyebrow--gold' : '', className]
    .filter(Boolean)
    .join(' ');
  return <p className={classes}>{children}</p>;
}

function EditorialCaption({ label, children }) {
  return (
    <figcaption className="editorial-caption">
      <span>{label}</span>
      {children}
    </figcaption>
  );
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const menuCloseRef = useRef(null);
  const { menuOpen, closeMenu, toggleMenu } = useSiteMenu(menuCloseRef);

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

    if (reducedMotion || !('IntersectionObserver' in window)) {
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
      { threshold: 0.04, rootMargin: '0px 0px 8% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    document.documentElement.classList.add('reveal-ready');
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, []);

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
            {primaryNavigation.map((item) => (
              <SiteLink key={item.to} item={item} active />
            ))}
          </nav>

          <div className="header-actions">
            <Link className="header-reserve" to="/reservations">
              Reserve
            </Link>
            <button
              className="menu-toggle"
              type="button"
              onClick={toggleMenu}
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
              <SiteLink key={item.label} item={item} active onClick={closeMenu}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.label}
              </SiteLink>
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
            <SectionEyebrow className="hero-kicker">Tea room · Restaurant · Catering</SectionEyebrow>
            <h1 id="hero-title">
              A beautiful reason
              <em>to linger.</em>
            </h1>
            <p className="hero-intro">
              Curated teas, artful bites, private rooms, and catering in a character-filled downtown Ocala setting made for unrushed conversation.
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
            <div className="hero-seal" aria-hidden="true">
              <span>1890</span>
              <i>Tea House · Ocala</i>
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
            <SectionEyebrow>An everyday retreat</SectionEyebrow>
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
              Set inside the historic Diamond Suites building, the tea house brings together thoughtfully selected drinks, delicate bites, individually styled rooms, and a welcoming patio in downtown Ocala.
            </p>
            <p>
              Come for a pot and a quiet lunch, make an afternoon of tea and dessert, or gather a table around charcuterie and conversation. The experience is polished without feeling hurried or formal.
            </p>
            <p>
              That balance is the heart of 1890: a memorable setting with the ease of a neighborhood welcome, designed for everyday visits as much as celebrations.
            </p>
            <blockquote>“A memorable setting with the ease of a neighborhood welcome.”</blockquote>
            <div className="story-actions">
              <Link className="text-link" to="/about">
                Read our story <Arrow />
              </Link>
              <a className="text-link" href="#tea-rooms">
                Explore the rooms <Arrow />
              </a>
            </div>
          </div>

          <figure className="story-image image-reveal">
            <img
              src={building}
              alt="The black, white, and pink 1890 Tea House with its outdoor patio"
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
            />
            <EditorialCaption label="Downtown Ocala">
              The Tea House at Diamond Suites on Silver Springs Boulevard
            </EditorialCaption>
          </figure>
        </section>

        <section className="experience section-pad" aria-labelledby="experience-title">
          <div className="experience-intro" data-reveal>
            <SectionEyebrow>The 1890 experience</SectionEyebrow>
            <h2 id="experience-title">Choose your own kind of pause.</h2>
            <p>
The Tea House can be a quiet stop for tea or coffee, a relaxed place to enjoy lunch with sandwiches, charcuterie, and something sweet, or an afternoon destination where conversation is allowed to unfold without feeling rushed. It can also become the setting for a birthday, bridal shower, private gathering, business meeting, or meaningful milestone shared with the people who matter most. Whether you choose an individually styled Tea Room, a table on the patio when available, or a cozy spot for two, each visit offers its own rhythm. Come for a quick cup, stay for dessert, make an afternoon of it, or turn the occasion into a memory. Every experience begins with the same invitation: settle in, savor each detail, and stay awhile.

            </p>
          </div>

          <figure className="experience-image image-reveal" data-reveal>
            <img
              src={interior}
              alt="An elegant 1890 Tea House interior with a set table and chandelier"
              width="1442"
              height="903"
              loading="lazy"
              decoding="async"
            />
            <EditorialCaption label="Inside 1890">Rooms with their own character, ready for tea, lunch, and conversation.</EditorialCaption>
          </figure>

          <p className="experience-ledger-label" data-reveal>Four ways to take your time</p>
          <div className="experience-grid">
            <article data-reveal>
              <span>01</span>
              <h3>A pot worth pausing for</h3>
              <p>Explore classic tea, matcha, chai, coffee, and other pours at the pace that suits your table.</p>
            </article>
            <article data-reveal>
              <span>02</span>
              <h3>Lunch with a little ceremony</h3>
              <p>Build a visit around tea sandwiches, light bites, charcuterie, pastries, or a well-earned dessert.</p>
            </article>
            <article data-reveal>
              <span>03</span>
              <h3>Space to gather</h3>
              <p>Individually styled tea rooms and event options give birthdays, showers, meetings, and reunions a distinctive backdrop.</p>
            </article>
            <article data-reveal>
              <span>04</span>
              <h3>The occasion can travel</h3>
              <p>Catering brings Tea House flavors to gatherings beyond these rooms, with details planned around your event.</p>
            </article>
          </div>
        </section>

        <section id="menus" className="menu-section" aria-labelledby="menu-title">
          <div className="menu-heading section-pad" data-reveal>
            <SectionEyebrow tone="gold">From the kitchen</SectionEyebrow>
            <h2 id="menu-title">A menu made to wander through.</h2>
            <p>
              Pair a pot or favorite pour with something savory, something sweet, or a charcuterie board for the whole table. The current menus make room for light lunches, lingering afternoons, and celebratory treats.
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
              <EditorialCaption label="From the menu">Signature charcuterie cup</EditorialCaption>
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
              <EditorialCaption label="Private rooms">A setting made for conversation and occasion.</EditorialCaption>
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
              <EditorialCaption label="Tea service">Details designed for an unhurried table.</EditorialCaption>
            </figure>
          </div>

          <div className="rooms-copy" data-reveal>
            <SectionEyebrow>Private tea rooms</SectionEyebrow>
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
                Planning for 12+? Send a group inquiry <Arrow />
              </Link>
            </div>
          </div>
        </section>

        <section id="events" className="events" aria-labelledby="events-title">
          <div className="events-image image-reveal" data-reveal>
            <img
              src={teaHouseBanner}
              alt="Wine and a charcuterie board prepared for an 1890 Tea House gathering"
              width="750"
              height="1000"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="events-copy section-pad" data-reveal>
            <SectionEyebrow tone="gold">Events & catering</SectionEyebrow>
            <h2 id="events-title">Bring the occasion. We’ll set the scene.</h2>
            <p>
              From bridal showers and birthdays to book clubs, business lunches, and gatherings elsewhere, 1890 offers an inviting setting and catering options for occasions that deserve thoughtful details.
            </p>
            <div className="event-types">
              <article>
                <span>01 · Gather here</span>
                <h3>Private celebrations</h3>
                <p>Ask about tea rooms and event options for meaningful moments, meetings, and larger tables.</p>
              </article>
              <article>
                <span>02 · Bring 1890 to you</span>
                <h3>Catering</h3>
                <p>Share your date, guest count, and menu needs so the team can discuss current catering options.</p>
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
            <SectionEyebrow tone="gold">Stories & updates</SectionEyebrow>
            <h2 id="notes-title">Around the tea table.</h2>
            <p>Original news from the house and first-party Journal stories, written for 1890.</p>
          </div>

          <div className="notes-grid">
            <article className="press-feature" data-reveal>
              <span>From 1890 · August 2026</span>
              <h3>The Tea House Journal is now open.</h3>
              <p>A new collection explores tea culture, thoughtful gatherings, and the small rituals that make time around a table feel special.</p>
              <Link className="text-link" to="/news/the-tea-house-journal-is-now-open">
                Read the update <Arrow />
              </Link>
            </article>

            <article className="press-feature press-feature--dark" data-reveal>
              <span>House update · August 2026</span>
              <h3>A simpler way to plan private gatherings.</h3>
              <p>Reservations, Tea Room information, and larger-party planning now live in one clear experience.</p>
              <Link className="text-link text-link--light" to="/news/a-simpler-way-to-plan-private-gatherings">
                Read the update <Arrow />
              </Link>
            </article>
          </div>

          <div id="journal" className="journal" data-reveal>
            <div className="journal-title">
              <SectionEyebrow>Journal</SectionEyebrow>
              <h3>Original stories for slower moments.</h3>
            </div>
            <Link to="/journal/how-to-build-an-afternoon-tea-that-feels-effortless">
              <span>August 5, 2026</span>
              <strong>How to Build an Afternoon Tea That Feels Effortless</strong>
              <Arrow />
            </Link>
            <Link to="/journal/the-art-of-the-tea-table-small-details-that-change-the-mood">
              <span>July 22, 2026</span>
              <strong>The Art of the Tea Table</strong>
              <Arrow />
            </Link>
          </div>
        </section>

        <section id="faq" className="faq section-pad" aria-labelledby="faq-title">
          <div className="faq-intro" data-reveal>
            <SectionEyebrow>Good to know</SectionEyebrow>
            <h2 id="faq-title">Before you visit.</h2>
            <p>Find quick answers about reservations, dietary needs, gatherings, and planning ahead.</p>
            <Link className="text-link" to="/contact">
              Send an inquiry <Arrow />
            </Link>
          </div>
          <div className="faq-list" data-reveal>
            {faqs.map((item, index) => (
              <article className={`faq-item ${openFaq === index ? 'is-open' : ''}`} key={item.question}>
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                >
                  <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="faq-question">{item.question}</span>
                  <i aria-hidden="true" />
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className="faq-answer"
                  aria-hidden={openFaq !== index}
                >
                  <div><p>{item.answer}</p></div>
                </div>
              </article>
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
            <SectionEyebrow tone="gold">Come take your time</SectionEyebrow>
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

        <section className="closing-cta section-pad" aria-labelledby="closing-title">
          <SectionEyebrow className="closing-label">Plan your visit</SectionEyebrow>
          <div className="closing-cta-copy" data-reveal>
            <h2 id="closing-title">A table, a room, or an occasion of your own.</h2>
            <p>Browse what is being served, reserve a smaller table, or tell the Tea House team what you are planning.</p>
          </div>
          <div className="closing-cta-actions" data-reveal>
            <a className="button button--ink" href={reservationLink} target="_blank" rel="noreferrer">Reserve a table <Arrow /></a>
            <Link className="button button--outline-ink" to="/menus">View the menus <Arrow /></Link>
            <Link className="text-link" to={largePartyLink}>Plan a gathering <Arrow /></Link>
          </div>
        </section>
      </main>

      <footer className="site-footer section-pad">
        <div className="footer-brand">
          <BrandMark />
          {/* <p>Tea, dining, private rooms, and catering in downtown Ocala.</p> */}
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

        {footerNavigationGroups.map((group) => (
          <div className="footer-nav" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => (
              <SiteLink key={item.to} item={item} />
            ))}
          </div>
        ))}

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
          <p>© {new Date().getFullYear()} 1890 Tea House. All rights reserved.</p>
          <nav className="footer-legal" aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
          <a href="#home">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </div>
  );
}

export default App;