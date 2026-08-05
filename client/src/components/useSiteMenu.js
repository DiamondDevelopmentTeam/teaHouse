import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function restoreDocumentScrolling() {
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
}

export default function useSiteMenu(closeButtonRef) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    restoreDocumentScrolling();
  }, [pathname, hash]);

  useEffect(() => {
    if (!menuOpen) {
      restoreDocumentScrolling();
      return undefined;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      restoreDocumentScrolling();
    };
  }, [closeButtonRef, menuOpen]);

  useEffect(() => () => restoreDocumentScrolling(), []);

  return {
    menuOpen,
    closeMenu: () => setMenuOpen(false),
    toggleMenu: () => setMenuOpen((open) => !open),
  };
}
