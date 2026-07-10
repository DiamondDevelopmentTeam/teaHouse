import { useEffect, useState } from 'react';
import './App.css';

import building from './assets/images/building.webp';
import cupOfFruits from './assets/images/cupOfFruits.jpg';
import diamondSuites from './assets/images/DiamondSuitesDownTownOcala.webp';
import tableOfTeaHouse from './assets/images/tableOfTeaHouse.jpg';
import teaHouseBanner from './assets/images/teaHouseBanner.webp';
import teaHouseLogo from './assets/images/TeaHouseLogo.webp';
import teaTime from './assets/images/teaTime.jpg';

const reservationLink =
  'https://toast.app/r/d470b089-02bc-4930-8828-ada15babda58/reserve';

const applicationLink = 'https://1890teahouse.com/server-application/';

const navLinks = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Menus', id: 'menus' },
  { label: 'Events', id: 'events' },
  { label: 'Reservations', id: 'reservations' },
  { label: 'Tea Rooms', id: 'tea-rooms' },
  { label: 'News', id: 'news' },
  { label: 'Gallery', id: 'gallery' },
  { label: 'FAQ’s', id: 'faq' },
  { label: 'Blog', id: 'blog' },
  { label: 'Contact', id: 'contact' },
];

const sandwiches = [
  { name: 'Cucumber Sando', price: '$7.00' },
  { name: 'Chive Wrapped Egg Salad Sando', price: '$9.00' },
  { name: 'Strawberry Sando', price: '$8.00' },
];

const desserts = [
  { name: 'Strawberry Lemon Swirl Tart', price: '$5.00' },
  { name: 'Greek Yogurt Panna Cotta', price: '$6.00' },
  { name: 'Tiramisu Truffles', price: '$7.00' },
];

const traditionItems = [
  { icon: '☕', text: 'Curated Teas & Beverages' },
  { icon: '△', text: 'Fresh Tea Sandwiches' },
  { icon: '♕', text: 'Signature Charcuterie Cups & Boards' },
  { icon: '🧁', text: 'Baked Desserts & Pastries Made Daily' },
  { icon: '▱', text: 'Reserve Your Private Tea Room Experience' },
];

const footerLinksOne = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Menus', id: 'menus' },
];

const footerLinksTwo = [
  { label: 'Events', id: 'events' },
  { label: 'Reservations', id: 'reservations' },
  { label: 'Tea Rooms', id: 'tea-rooms' },
  { label: 'News', id: 'news' },
  { label: 'Gallery', id: 'gallery' },
  { label: 'FAQ’s', id: 'faq' },
  { label: 'Blog', id: 'blog' },
  { label: 'Contact', id: 'contact' },
];

function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    const animatedElements = document.querySelectorAll(
      [
        '.hero-copy',
        '.hero-bottom',
        '.about-image',
        '.about-copy',
        '.weather-card',
        '.favorites-section h2',
        '.favorites-grid article',
        '.media-mosaic > div',
        '.tradition-images',
        '.tradition-copy',
        '.placeholder-section > div',
        '.faq-grid article',
        '.contact-intro',
        '.contact-details article',
        '.gallery-strip img',
        '.footer > *',
      ].join(',')
    );

    animatedElements.forEach((element) => {
      element.classList.add('animate-on-scroll');
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -70px 0px',
      }
    );

    animatedElements.forEach((element) => observer.observe(element));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="site">
      <header className={`floating-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <nav className="nav-left" aria-label="Main navigation">
          {navLinks.map((link) => (
            <button key={link.id} type="button" onClick={() => scrollToSection(link.id)}>
              {link.label}
            </button>
          ))}
        </nav>

        <button
          className="center-logo"
          type="button"
          onClick={() => scrollToSection('home')}
          aria-label="Go to homepage"
        >
          <img src={teaHouseLogo} alt="1890 Tea House logo" />
        </button>

        <div className="header-actions">
          <h2>Join Our Team!</h2>

          <div className="header-button-row">
            <a href={applicationLink} target="_blank" rel="noreferrer">
              Application
              <span>Form</span>
            </a>

            <a href={reservationLink} target="_blank" rel="noreferrer">
              Make a Reservation
              <span>(1-11 Guests)</span>
            </a>
          </div>

          <button type="button" onClick={() => scrollToSection('contact')}>
            Make a Reservation
            <span>(12 + Guests)</span>
          </button>
        </div>
      </header>

      <section id="home" className="hero">
        <img src={teaHouseBanner} alt="Tea house charcuterie spread" />

        <button className="hero-arrow left" type="button" aria-label="Previous slide">
          ‹
        </button>

        <button className="hero-arrow right" type="button" aria-label="Next slide">
          ›
        </button>

        <div className="hero-copy">
          <h1>
            Sip. Savor.
            <span>Slow Down.</span>
          </h1>

          <button type="button" onClick={() => scrollToSection('tea-rooms')}>
            Reserve Your Tea Room
          </button>
        </div>

        <div className="hero-bottom">
          <h2>Come Join Us!</h2>

          <div className="slider-dots" aria-hidden="true">
            <span />
            <span className="active" />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-image">
          <img src={tableOfTeaHouse} alt="Tea house room" />
        </div>

        <div className="about-copy">
          <h2>
            An Everyday Retreat
            <span>in Downtown Ocala</span>
          </h2>

          <p>
            Welcome to 1890 Tea House, Downtown Ocala’s hidden gem, where
            timeless elegance meets modern charm.
          </p>

          <p>
            Nestled inside the historic Diamond Suites building, we invite you to
            step away from the everyday and enjoy the art of tea, delicate bites,
            and warm conversation.
          </p>

          <button type="button" onClick={() => scrollToSection('menus')}>
            View Our Menus
          </button>

          <div className="weather-card">
            <h3>Cold Or Rainy Day? We’ve Got You Covered</h3>
            <p>
              Enjoy our cozy indoor seating, comfort, and charm, no matter the
              weather.
            </p>
          </div>
        </div>
      </section>

      <section id="menus" className="favorites-section">
        <h2>Our Favorites</h2>

        <div className="favorites-grid">
          <article>
            <h3>Tea Sandwiches</h3>

            {sandwiches.map((item) => (
              <div className="favorite-item" key={item.name}>
                <h4>{item.name}</h4>
                <p>{item.price}</p>
              </div>
            ))}
          </article>

          <article>
            <h3>Desserts</h3>

            {desserts.map((item) => (
              <div className="favorite-item" key={item.name}>
                <h4>{item.name}</h4>
                <p>{item.price}</p>
              </div>
            ))}
          </article>
        </div>

        <button type="button" onClick={() => scrollToSection('contact')}>
          View Our Menus
        </button>
      </section>

      <section id="events" className="media-mosaic">
        <div className="mosaic-large">
          <img src={teaTime} alt="Tea house food display" />
        </div>

        <div className="mosaic-top">
          <img src={tableOfTeaHouse} alt="Tea room details" />
        </div>

        <div className="mosaic-top">
          <img src={teaHouseBanner} alt="Charcuterie board" />
        </div>

        <div className="mosaic-logo black-placeholder">
          <img src={teaHouseLogo} alt="1890 Tea House logo" />
        </div>
      </section>

      <section id="tea-rooms" className="tradition-section">
        <div className="tradition-images">
          <img className="board-image" src={building} alt="1890 Tea House exterior" />
          <img className="tea-image" src={teaTime} alt="Tea sandwiches and tea" />
        </div>

        <div className="tradition-copy">
          <h2>
            A Taste
            <span>of Timeless Tradition</span>
          </h2>

          <ul>
            {traditionItems.map((item) => (
              <li key={item.text}>
                <span>{item.icon}</span>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>

          <button type="button" onClick={() => scrollToSection('menus')}>
            View Our Menus
          </button>
        </div>
      </section>

      <section id="news" className="placeholder-section">
        <div>
          <h2>News</h2>
          <p>
            Add seasonal announcements, private event updates, new menu items,
            and special tea room moments here.
          </p>
        </div>

        <div className="placeholder-grid">
          <div className="black-placeholder">
            <span>Image Coming Soon</span>
          </div>
          <div className="black-placeholder">
            <span>Image Coming Soon</span>
          </div>
          <div className="black-placeholder">
            <span>Image Coming Soon</span>
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery-strip">
        <button className="gallery-arrow left" type="button" aria-label="Previous gallery item">
          ‹
        </button>

        <img src={cupOfFruits} alt="Tea cup and sandwiches" />
        <img src={teaHouseBanner} alt="Charcuterie spread" />
        <img src={tableOfTeaHouse} alt="Tea room" />

        <div className="black-placeholder">
          <span>Image Coming Soon</span>
        </div>

        <img src={teaTime} alt="Tea time seating" />
        <img src={building} alt="1890 Tea House exterior" />

        <button className="gallery-arrow right" type="button" aria-label="Next gallery item">
          ›
        </button>
      </section>

      <section id="faq" className="faq-section">
        <h2>FAQ’s</h2>

        <div className="faq-grid">
          <article>
            <h3>Do I need a reservation?</h3>
            <p>
              Reservations are recommended, especially for tea rooms and larger
              parties.
            </p>
          </article>

          <article>
            <h3>Can I book 12+ guests?</h3>
            <p>
              Yes. Please reach out directly so the team can help coordinate the
              right setup.
            </p>
          </article>

          <article>
            <h3>Is there indoor seating?</h3>
            <p>
              Yes. The tea house offers cozy indoor seating with comfort and
              charm.
            </p>
          </article>
        </div>
      </section>

      <section id="blog" className="placeholder-section light">
        <div>
          <h2>Blog</h2>
          <p>
            This section is ready for future blog cards, seasonal tea notes, and
            announcements.
          </p>
        </div>

        <div className="placeholder-grid two">
          <div className="black-placeholder">
            <span>Blog Image Coming Soon</span>
          </div>
          <div className="black-placeholder">
            <span>Blog Image Coming Soon</span>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact-intro">
          <h2>Get in Touch</h2>

          <p>
            At 1890 Tea House, every detail is designed to create a moment worth
            savoring. From the delicate aroma of steeping teas to the beauty of
            our artfully presented charcuterie and pastries, each visit feels
            like an escape from the ordinary.
          </p>

          <p>
            Whether you’re stopping in for a quiet afternoon cup, gathering with
            friends, or reserving a private tea room for a special occasion, our
            tea house offers an atmosphere of warmth, elegance, and timeless
            charm right in the heart of Downtown Ocala.
          </p>
        </div>

        <div className="contact-details">
          <article>
            <span className="contact-icon">●</span>
            <div>
              <h3>Address</h3>
              <p>917 E Silver Springs Blvd</p>
              <p>Ocala, FL 34470</p>
            </div>
          </article>

          <article>
            <span className="contact-icon">▯</span>
            <div>
              <h3>Contact Details</h3>
              <p>
                <a href="mailto:ashley@1890teahouse.com">
                  ashley@1890teahouse.com
                </a>
              </p>
              <p>
                <a href="tel:3522448368">352-244-8368</a>
              </p>
            </div>
          </article>

          <article className="hours">
            <span className="contact-icon">◷</span>
            <div>
              <h3>Hours</h3>
              <ul>
                <li>Mon–Thurs: 11:00am – 7:00pm</li>
                <li>Fri–Sat: 11:00am – 9:00pm</li>
                <li>Sun: 11:00am – 4:00pm</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo-area">
          <img
            className="footer-tea-logo"
            src={teaHouseLogo}
            alt="1890 Tea House logo"
          />

          <img
            className="footer-diamond-logo"
            src={diamondSuites}
            alt="Diamond Suites Downtown Ocala"
          />

          <p>Copyright © 2026. All Rights Reserved.</p>
        </div>

        <div className="footer-column">
          {footerLinksOne.map((item) => (
            <button key={item.id} type="button" onClick={() => scrollToSection(item.id)}>
              {item.label}
            </button>
          ))}

          <div className="footer-hours">
            <p>Hours:</p>
            <p>Mon-Thurs: 11:00am – 7:00pm</p>
            <p>Fri-Sat: 11:00am – 9:00pm</p>
            <p>Sun: 11:00am – 4:00pm</p>
          </div>

          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms and Conditions</a>
        </div>

        <div className="footer-column">
          {footerLinksTwo.map((item) => (
            <button key={item.id} type="button" onClick={() => scrollToSection(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="footer-contact">
          <h3>Contact</h3>

          <p>
            <strong>Location:</strong>
            917 E Silver Springs Blvd
            <span>Ocala, FL 34470</span>
          </p>

          <p>
            <strong>Phone:</strong>
            <a href="tel:3522448368">352-244-8368</a>
          </p>

          <p>
            <a href="mailto:ashley@1890teahouse.com">
              ashley@1890teahouse.com
            </a>
          </p>

          <div className="socials" aria-label="Social links">
            <span>f</span>
            <span>◎</span>
            <span>✹</span>
            <span>♪</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default App;