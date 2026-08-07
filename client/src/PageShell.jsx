import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import teaHouseLogo from '../assets/images/TeaHouseLogo.webp';
import diamondSuites from '../assets/images/DiamondSuitesDownTownOcala.webp';
import {
  business,
  footerNavigationGroups,
  navigation,
  primaryNavigation,
} from '../data/business.js';
import OptimizedImage from './OptimizedImage.jsx';
import SiteLink from './SiteLink.jsx';
import useSiteMenu from './useSiteMenu.js';
import '../pages.css';
import '../journal-page.css';

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
  const menuCloseRef = useRef(null);
  const { menuOpen, closeMenu, toggleMenu } = useSiteMenu(menuCloseRef);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 32);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="site-shell page-site">
      <a className="skip-link" href="#page-main">Skip to content</a>
      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-inner">
          <BrandMark compact={isScrolled} onClick={closeMenu} />
          <nav className="primary-nav" aria-label="Primary navigation">
            {primaryNavigation.map((item) => {
              const displayItem =
                item.to === '/contact'
                  ? { ...item, label: 'Visit 1890 Teahouse' }
                  : item;

              return <SiteLink key={item.to} item={displayItem} active />;
            })}
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
            <SiteLink item={{ label: 'Home', to: '/', type: 'route' }} active onClick={closeMenu}><span>01</span>Home</SiteLink>
            {navigation.map((item, index) => (
              <SiteLink key={item.to} item={item} active onClick={closeMenu}>
                <span>{String(index + 2).padStart(2, '0')}</span>{item.label}
              </SiteLink>
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
          <p>Tea, dining, private rooms, and catering in downtown Ocala.</p>
          <OptimizedImage className="diamond-logo" src={diamondSuites} alt="Diamond Suites Downtown Ocala" width={1200} height={200} />
        </div>
        {footerNavigationGroups.map((group) => (
          <div className="footer-nav" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => <SiteLink key={item.to} item={item} />)}
          </div>
        ))}
        <div className="footer-visit">
          <p>Visit 1890 Teahouse</p>
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
          <nav className="footer-legal" aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
          <a href="#page-main">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </div>
  );
}