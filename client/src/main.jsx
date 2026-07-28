import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import App from './App.jsx';
import {
  AboutPage,
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
  CareersPage,
} from './Pages.jsx';

const basename =
  import.meta.env.BASE_URL === '/'
    ? '/'
    : import.meta.env.BASE_URL.replace(/\/$/, '');

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') {
      document.title = '1890 Tea House | Tea Room, Restaurant & Catering';
    }

    if (location.hash) {
      let cancelled = false;
      const scrollToAnchor = () => {
        if (cancelled) return;
        const target = document.getElementById(location.hash.slice(1));
        if (!target) return;
        const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
        window.scrollTo({
          top: window.scrollY + target.getBoundingClientRect().top - headerHeight,
          left: 0,
          behavior: 'instant',
        });
      };
      const frame = window.requestAnimationFrame(scrollToAnchor);
      const timers = [
        window.setTimeout(scrollToAnchor, 300),
        window.setTimeout(scrollToAnchor, 1000),
      ];
      document.fonts?.ready.then(scrollToAnchor);
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
        timers.forEach(window.clearTimeout);
      };
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [location.hash, location.pathname]);

  return null;
}

const rootElement = document.getElementById('root');
const root =
  import.meta.hot && window.__teaHouseRoot
    ? window.__teaHouseRoot
    : createRoot(rootElement);

if (import.meta.hot) window.__teaHouseRoot = root;

root.render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <RouteEffects />
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
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
