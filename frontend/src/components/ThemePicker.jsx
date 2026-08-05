/**
 * ThemePicker — a compact popover with Light / Dark / System options.
 * Replaces the old ThemeToggle binary icon.
 * Reads / writes from SettingsContext so the choice persists cross-device.
 */
import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const MODES = [
  { id: 'light',  label: 'Light',  Icon: Sun },
  { id: 'dark',   label: 'Dark',   Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
];

const MODE_ICON = { light: Sun, dark: Moon, system: Monitor };

export default function ThemePicker({ transparent = false }) {
  const { prefs, setPref } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeMode = prefs?.mode || 'dark';
  const ActiveIcon = MODE_ICON[activeMode] || Moon;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        id="theme-picker-trigger"
        onClick={() => setOpen(v => !v)}
        aria-label="Change theme mode"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[36px] min-w-[36px] ${
          transparent
            ? 'text-white/80 hover:bg-white/10 hover:text-white border border-white/20'
            : 'text-text-muted hover:bg-surface-2 hover:text-text-primary border border-transparent hover:border-border'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
      >
        <ActiveIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline capitalize text-xs tracking-wide">{activeMode}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Popover */}
      {open && (
        <div
          role="listbox"
          aria-label="Select theme mode"
          className="absolute right-0 top-full mt-2 w-44 z-50 rounded-xl border border-border bg-surface shadow-xl shadow-black/10 overflow-hidden animate-popover-in"
          style={{ animationDuration: '150ms' }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Theme mode</p>
          </div>

          {MODES.map(({ id, label, Icon }) => {
            const isActive = activeMode === id;
            return (
              <button
                key={id}
                role="option"
                aria-selected={isActive}
                onClick={() => { setPref('mode', id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/8 text-brand font-semibold'
                    : 'text-text-primary hover:bg-surface-2'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand' : 'text-text-muted'}`} />
                <span className="flex-1 text-left">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                )}
              </button>
            );
          })}

          {/* Footer note */}
          <div className="px-3 py-2 border-t border-border">
            <p className="text-[10px] text-text-muted leading-tight">Applies across the whole app.</p>
          </div>
        </div>
      )}
    </div>
  );
}
