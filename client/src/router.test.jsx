// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { normalizeBasename, RouteEffects, SiteRoutes } from './router.jsx';
import { business } from './data/business.js';

vi.mock('./components/FormVerification.jsx', () => ({
  default: function TestVerification() {
    return <div className="page-form-recaptcha">Human verification</div>;
  },
}));

function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouteEffects />
      <SiteRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame = vi.fn((callback) => {
    callback();
    return 1;
  });
  window.cancelAnimationFrame = vi.fn();
  window.matchMedia = vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(cleanup);

describe('site routing', () => {
  it.each([
    ['/', /A beautiful reason/i],
    ['/about', /A taste of elegance/i],
    ['/menus', /Simple\. Fresh\. Beautiful\./i],
    ['/reservations', /Choose the gathering/i],
    ['/contact', /Come take your time/i],
    ['/server-application', /Hospitality begins with a warm welcome/i],
    ['/privacy', /Privacy Policy/i],
    ['/terms', /Terms and Conditions/i],
    ['/journal/how-to-build-an-afternoon-tea-that-feels-effortless', /How to Build an Afternoon Tea/i],
    ['/news/the-tea-house-journal-is-now-open', /The Tea House Journal is now open/i],
  ])('renders %s as a routed page', (path, heading) => {
    renderRoute(path);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeTruthy();
  });

  it('renders the not-found page for an unknown route', () => {
    renderRoute('/not-a-real-tea-house-page');
    expect(screen.getByRole('heading', { level: 1, name: /gone out for tea/i })).toBeTruthy();
  });

  it('keeps header and footer destinations as routed links', () => {
    renderRoute('/about');
    const header = screen.getByRole('banner');
    const footer = screen.getByRole('contentinfo');
    expect(within(header).getByRole('link', { name: 'Tea & Dining' }).getAttribute('href')).toBe('/menus');
    expect(within(header).getByRole('link', { name: 'Our Story' }).getAttribute('href')).toBe('/about');
    expect(within(header).getByRole('link', { name: 'Gatherings' }).getAttribute('href')).toBe('/reservations');
    expect(within(header).getByRole('link', { name: 'Visit' }).getAttribute('href')).toBe('/contact');
    expect(within(header).getByRole('link', { name: 'Reserve' }).getAttribute('href')).toBe('/reservations');
    expect(within(footer).getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    expect(within(footer).getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
    expect(within(footer).getByRole('link', { name: 'Server Application' }).getAttribute('href')).toBe('/server-application');
  });

  it('closes the mobile menu and restores document scrolling after routed navigation', async () => {
    const user = userEvent.setup();
    renderRoute('/about');
    await user.click(screen.getByRole('button', { name: 'Open site menu' }));
    const menu = screen.getByRole('dialog', { name: 'Site menu' });
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    await user.click(within(menu).getByRole('link', { name: /Menus/ }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Simple\. Fresh\. Beautiful\./i })).toBeTruthy();
      expect(menu.getAttribute('aria-hidden')).toBe('true');
      expect(document.body.style.overflow).not.toBe('hidden');
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });
  });

  it('uses routed primary navigation on the homepage while keeping contextual anchors', () => {
    renderRoute('/');
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Our Story' }).getAttribute('href')).toBe('/about');
    expect(within(header).getByRole('link', { name: 'Tea & Dining' }).getAttribute('href')).toBe('/menus');
    expect(screen.getByRole('link', { name: /Read our story/i }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: /View all menus/i }).getAttribute('href')).toBe('/menus');
  });

  it('scrolls only when a routed location contains a hash', async () => {
    render(
      <MemoryRouter initialEntries={['/#about']}>
        <RouteEffects />
        <div id="about">Story target</div>
      </MemoryRouter>,
    );
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    }));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('renders both images in the layered Tea Rooms composition', () => {
    renderRoute('/');
    expect(screen.getByRole('img', { name: /private tea room with pink velvet seating/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /floral tea service arranged on a gold stand/i })).toBeTruthy();
  });

  it('keeps reveal content visible for reduced-motion visitors', async () => {
    const { container } = renderRoute('/');
    await waitFor(() => {
      const revealItems = [...container.querySelectorAll('[data-reveal]')];
      expect(revealItems.length).toBeGreaterThan(0);
      expect(revealItems.every((item) => item.classList.contains('is-visible'))).toBe(true);
    });
  });

  it('uses one consistent media frame for every press card', () => {
    const { container } = renderRoute('/news');
    const cards = container.querySelectorAll('.page-press-grid article');
    const media = container.querySelectorAll('.page-press-media');
    expect(cards.length).toBe(3);
    expect(media.length).toBe(cards.length);
  });

  it('keeps the Reservations hero image and three next actions correctly routed', () => {
    const { container } = renderRoute('/reservations');
    const hero = container.querySelector('.reservations-hero__inner');
    const image = within(hero).getByRole('img', { name: /floral teapots/i });
    expect(image.getAttribute('width')).toBe('800');
    expect(image.getAttribute('height')).toBe('1422');
    expect(within(hero).getByRole('link', { name: /Reserve a Table/ }).getAttribute('href')).toBe(business.reservationUrl);
    expect(within(hero).getByRole('link', { name: 'Reserve a Tea Room' }).getAttribute('href')).toBe('/tea-rooms');
    expect(within(hero).getByRole('link', { name: 'Plan a Gathering for 12+' }).getAttribute('href')).toBe('/reservations#large-party');
  });

  it('normalizes the GitHub Pages basename without breaking local development', () => {
    expect(normalizeBasename('/')).toBe('/');
    expect(normalizeBasename('/teaHouse/')).toBe('/teaHouse');
  });
});
