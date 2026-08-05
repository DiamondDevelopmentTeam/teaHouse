import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import App from './App.jsx';
import ServerApplicationPage from './ServerApplicationPage.jsx';
import { restoreDocumentScrolling } from './components/useSiteMenu.js';
import {
  AboutPage,
  CareersPage,
  ContactPage,
  EventsPage,
  FAQPage,
  GalleryPage,
  JournalArticlePage,
  JournalPage,
  LegalPage,
  MenusPage,
  NewsPage,
  NotFoundPage,
  ReservationsPage,
  TeaRoomsPage,
} from './Pages.jsx';

export function normalizeBasename(baseUrl) {
  return baseUrl === '/' ? '/' : baseUrl.replace(/\/$/, '');
}

export function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    restoreDocumentScrolling();

    if (location.pathname === '/') {
      document.title = '1890 Tea House | Tea Room, Restaurant & Catering';
    }

    if (location.hash) {
      let targetId = location.hash.slice(1);
      try {
        targetId = decodeURIComponent(targetId);
      } catch {
        // Keep the literal fragment when it contains malformed escape sequences.
      }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [location.hash, location.pathname]);

  return null;
}

export function SiteRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/menus" element={<MenusPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/tea-rooms" element={<TeaRoomsPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/faqs" element={<FAQPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/journal/:slug" element={<JournalArticlePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/server-application" element={<ServerApplicationPage />} />
      <Route path="/privacy" element={<LegalPage type="privacy" />} />
      <Route path="/terms" element={<LegalPage type="terms" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
