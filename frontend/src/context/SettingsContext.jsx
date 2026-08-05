/**
 * SettingsContext — Phase 2 (System-mode fix)
 *
 * Root cause of "system" mode rendering broken:
 *   The Tailwind custom variant is defined as:
 *     @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))
 *   Writing data-theme="system" to the DOM bypasses this entirely, so every
 *   Tailwind `dark:` class is un-applied while CSS-var overrides still fire —
 *   producing a broken half-dark hybrid (dark backgrounds, light card surfaces).
 *
 * Fix:
 *   Never write "system" to the DOM. Instead, resolve the actual OS preference
 *   via matchMedia and write "dark" or "light". Store "system" in localStorage
 *   and the DB as the user's intent, but only resolved values touch data-theme.
 *
 *   Also attach a matchMedia listener so if the user changes their OS theme
 *   while the app is open, the UI updates in real-time.
 */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQuery }          from '@tanstack/react-query';
import client                from '../api/client';
import { useSettingsMutation } from '../hooks/useSettingsMutation';

const SettingsContext = createContext();

export const DEFAULTS = {
  mode:    'dark',
  palette: 'default',
  accent:  'auto',
  font:    'inter',
  density: 'normal',
};

export const FONT_FAMILIES = {
  inter:   "'Inter', system-ui, -apple-system, sans-serif",
  dmsans:  "'DM Sans', system-ui, sans-serif",
  outfit:  "'Outfit', system-ui, sans-serif",
  manrope: "'Manrope', system-ui, sans-serif",
};

/** Resolve "system" to "dark" or "light" using the OS preference. */
function resolveMode(mode) {
  if (mode !== 'system') return mode;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const SettingsProvider = ({ children }) => {
  // Initialise from localStorage or DEFAULTS — zero flash
  const [prefs, setPrefsState] = useState(() => {
    try {
      const stored = localStorage.getItem('hs_prefs');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // Keep a stable ref to prefs for the matchMedia listener
  const prefsRef = useRef(prefs);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);

  /**
   * Apply preferences to the DOM.
   *
   * KEY RULE: data-theme is always written as "dark" or "light" — never "system".
   * The stored prefs.mode value can be "system", but what hits the DOM is resolved.
   */
  const applyPrefsToDOM = useCallback((p) => {
    const root    = document.documentElement;
    const resolved = resolveMode(p.mode); // "dark" | "light"

    root.setAttribute('data-theme',   resolved);       // Tailwind dark: classes work ✓
    root.setAttribute('data-palette', p.palette);
    root.setAttribute('data-density', p.density || 'normal');

    // Accent — 'auto' means palette defines brand-primary
    if (p.accent && p.accent !== 'auto') {
      root.style.setProperty('--brand-primary', p.accent);
      root.style.setProperty('--brand-hover',   p.accent);
    } else {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-hover');
    }

    // Font family
    const fontValue = FONT_FAMILIES[p.font] || FONT_FAMILIES.inter;
    root.style.setProperty('--font-body', fontValue);
  }, []);

  // Apply immediately on mount and whenever prefs change
  useEffect(() => {
    applyPrefsToDOM(prefs);
  }, [prefs, applyPrefsToDOM]);

  /**
   * Real-time OS preference listener.
   * When the user changes Light/Dark in System Preferences while the app is open,
   * we re-apply DOM attributes so the theme updates without a page reload.
   * Only active when prefs.mode === "system".
   */
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;

    const handler = () => {
      if (prefsRef.current.mode === 'system') {
        applyPrefsToDOM(prefsRef.current);
      }
    };

    // addEventListener is supported in all modern browsers
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [applyPrefsToDOM]);

  // Load saved preferences from the DB (cross-device sync)
  const { data: dbUser } = useQuery({
    queryKey: ['me'],
    queryFn:  () => client('/auth/me', { skipAuthRedirect: true }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const mutation = useSettingsMutation();

  // Merge DB preferences when they arrive
  useEffect(() => {
    if (dbUser?.preferences) {
      setPrefsState(prev => {
        const merged = { ...DEFAULTS, ...prev, ...dbUser.preferences };
        localStorage.setItem('hs_prefs', JSON.stringify(merged));
        applyPrefsToDOM(merged);
        return merged;
      });
    }
  }, [dbUser?.preferences, applyPrefsToDOM]);

  const setPref = useCallback((key, value) => {
    setPrefsState(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('hs_prefs', JSON.stringify(updated));
      applyPrefsToDOM(updated);
      return updated;
    });
    mutation.mutate({ [key]: value });
  }, [mutation, applyPrefsToDOM]);

  const resetPrefs = useCallback(() => {
    setPrefsState(DEFAULTS);
    localStorage.setItem('hs_prefs', JSON.stringify(DEFAULTS));
    applyPrefsToDOM(DEFAULTS);
    mutation.mutate(DEFAULTS);
  }, [mutation, applyPrefsToDOM]);

  return (
    <SettingsContext.Provider value={{ prefs, setPref, resetPrefs }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
