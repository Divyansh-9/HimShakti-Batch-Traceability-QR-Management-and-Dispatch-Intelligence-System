/**
 * useTheme — thin proxy over SettingsContext.
 *
 * The old binary toggle (light ↔ dark) still works for any component
 * that hasn't migrated to ThemePicker yet. But it now reads/writes
 * through SettingsContext instead of maintaining its own localStorage key,
 * so there is ONE source of truth for the active mode.
 *
 * Note: the old 'theme' localStorage key is no longer used.
 * The canonical key is 'hs_prefs' (managed by SettingsContext).
 */
import { useContext } from 'react';
import { useSettings } from '../context/SettingsContext';

export function useTheme() {
  const ctx = useSettings();

  // Guard: if somehow called outside SettingsProvider (e.g., old tests),
  // fall back to a harmless no-op.
  if (!ctx) {
    return { theme: 'dark', toggleTheme: () => {} };
  }

  const { prefs, setPref } = ctx;

  // Resolve 'system' to the real OS preference for read operations
  const resolvedTheme = (() => {
    if (prefs.mode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return prefs.mode;
  })();

  // Toggle: light → dark → (skip system, user explicitly chose binary)
  const toggleTheme = () => setPref('mode', resolvedTheme === 'light' ? 'dark' : 'light');

  return { theme: resolvedTheme, toggleTheme, mode: prefs.mode };
}
