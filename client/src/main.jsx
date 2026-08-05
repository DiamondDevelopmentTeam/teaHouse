import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { normalizeBasename, RouteEffects, SiteRoutes } from './router.jsx';

const basename = normalizeBasename(import.meta.env.BASE_URL);

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
      <SiteRoutes />
    </BrowserRouter>
  </StrictMode>,
);
