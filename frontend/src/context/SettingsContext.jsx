import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { useSettingsMutation } from '../hooks/useSettingsMutation';

const SettingsContext = createContext();

export const DEFAULTS = {
  mode:    'dark',
  palette: 'default',
  accent:  'auto',
  font:    'inter',
  density: 'normal',
};

// Map font id → CSS font-family value
export const FONT_FAMILIES = {
  inter:   "'Inter', system-ui, -apple-system, sans-serif",
  dmsans:  "'DM Sans', system-ui, sans-serif",
  outfit:  "'Outfit', system-ui, sans-serif",
  manrope: "'Manrope', system-ui, sans-serif",
};

export const SettingsProvider = ({ children }) => {
  // 1. Initialise from localStorage or DEFAULTS — zero flash
  const [prefs, setPrefsState] = useState(() => {
    try {
      const stored = localStorage.getItem('hs_prefs');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // 2. Apply preferences to the DOM (data-attributes + CSS vars)
  const applyPrefsToDOM = useCallback((p) => {
    const root = document.documentElement;

    // Theme mode
    root.setAttribute('data-theme', p.mode);

    // Colour palette
    root.setAttribute('data-palette', p.palette);

    // Density
    root.setAttribute('data-density', p.density || 'normal');

    // Accent — 'auto' means let palette define brand-primary
    if (p.accent && p.accent !== 'auto') {
      root.style.setProperty('--brand-primary', p.accent);
      // Derive a slightly darker hover from the same hue
      root.style.setProperty('--brand-hover', p.accent);
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

  // 3. Load saved preferences from the DB (cross-device sync)
  const { data: dbUser } = useQuery({
    queryKey: ['me'],
    queryFn:  () => client('/auth/me', { skipAuthRedirect: true }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // 4. Persist mutation
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

  // 5. Exposed functions
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
