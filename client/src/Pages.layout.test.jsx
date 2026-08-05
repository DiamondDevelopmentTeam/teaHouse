// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutPage } from './Pages.jsx';

vi.mock('./components/PageShell.jsx', async () => {
  const ReactModule = await import('react');
  return {
    default: function TestPageShell({ children }) {
      return ReactModule.createElement('main', null, children);
    },
  };
});

afterEach(cleanup);

describe('page layout fallbacks', () => {
  it('removes a failed hero image and switches to a text-led layout', async () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const hero = container.querySelector('.page-hero');
    const heroImage = hero.querySelector('.page-hero__media img');

    expect(heroImage).toBeTruthy();
    fireEvent.error(heroImage);

    await waitFor(() => {
      expect(hero.classList.contains('page-hero--text')).toBe(true);
      expect(hero.querySelector('.page-hero__media')).toBeNull();
    });
  });
});
