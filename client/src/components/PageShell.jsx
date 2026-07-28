import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import teaHouseLogo from '../assets/images/TeaHouseLogo.webp';
import diamondSuites from '../assets/images/DiamondSuitesDownTownOcala.webp';
import { business, navigation } from '../data/business.js';
import OptimizedImage from './OptimizedImage.jsx';
import '../pages.css';

const primaryPaths = new Set(['/about', '/menus', '/tea-rooms', '/contact']);

function BrandMark({ compact = false, onClick }) {
  return (
    <Link
      className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}
      to="/"
      onClick={onClick}
      aria-label="1890 Tea House home"
    >
      <OptimizedImage src={teaHouseLogo} alt="1890 Tea House" width={820} height={402} eager />
    </Link>
  );
}

export default function PageShell({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuCloseRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 32);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
    <div className="site-shell page-site">
      <a className="skip-link" href="#page-main">Skip to content</a>
      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-inner">
          <BrandMark compact={isScrolled} onClick={closeMenu} />
          <nav className="primary-nav" aria-label="Primary navigation">
            {navigation
              .filter(({ to }) => primaryPaths.has(to))
              .map(({ label, to }) => (
                <NavLink key={to} to={to}>{label === 'Contact' ? 'Visit' : label}</NavLink>
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
              aria-controls="page-site-menu"
              aria-label="Open site menu"
            >
              <span>Menu</span>
              <span className="menu-toggle-lines" aria-hidden="true"><i /><i /></span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="page-site-menu"
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
            <NavLink to="/" onClick={closeMenu}><span>01</span>Home</NavLink>
            {navigation.map(({ label, to }, index) => (
              <NavLink key={to} to={to} onClick={closeMenu}>
                <span>{String(index + 2).padStart(2, '0')}</span>{label}
              </NavLink>
            ))}
          </nav>
          <div className="menu-panel-details">
            <p>{business.address.street}<br />{business.address.locality}, {business.address.region} {business.address.postalCode}</p>
            <p>Wednesday–Sunday<br /><a href={business.phoneHref}>{business.phone}</a></p>
          </div>
        </div>
      </div>

      <main id="page-main">{children}</main>

      <footer className="site-footer section-pad">
        <div className="footer-brand">
          <BrandMark />
          <OptimizedImage className="diamond-logo" src={diamondSuites} alt="Diamond Suites Downtown Ocala" width={1200} height={200} />
        </div>
        <div className="footer-nav">
          <p>Explore</p>
          <Link to="/">Home</Link>
          {navigation.slice(0, 6).map(({ label, to }) => <Link key={to} to={to}>{label}</Link>)}
        </div>
        <div className="footer-nav">
          <p>More</p>
          {navigation.slice(6).map(({ label, to }) => <Link key={to} to={to}>{label}</Link>)}
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <div className="footer-visit">
          <p>Visit</p>
          <address>{business.address.street}<br />{business.address.locality}, {business.address.region} {business.address.postalCode}</address>
          <a href={business.phoneHref}>{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <div className="footer-socials" aria-label="Social media">
            {business.socials.map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noreferrer">{label}</a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 1890 Tea House. All rights reserved.</p>
          <a href="#page-main">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </div>
  );
}
