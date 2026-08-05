/**
 * ThemePicker — compact 3-option popover: Light / Dark / System.
 * Connected to SettingsContext. Works consistently on Home, About, Dashboard.
 *
 * System mode UX:
 *  - The trigger icon shows the RESOLVED mode (Sun/Moon) so the user can see
 *    what's actually being applied right now, not just the abstract "System" label.
 *  - The label shows "System" so they know it's following OS preference.
 *  - The popover still shows the Monitor icon for the System row.
 */
import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const MODES = [
  { id: 'light',  label: 'Light',  Icon: Sun,     desc: 'Always light'            },
  { id: 'dark',   label: 'Dark',   Icon: Moon,    desc: 'Always dark'             },
  { id: 'system', label: 'System', Icon: Monitor, desc: 'Follows your OS setting' },
];

/** Resolve "system" to actual OS preference for icon display. */
function resolveForDisplay(mode) {
  if (mode !== 'system') return mode;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const RESOLVED_ICON = { light: Sun, dark: Moon };

export default function ThemePicker({ transparent = false }) {
  const { prefs, setPref } = useSettings();
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);

  const activeMode    = prefs?.mode || 'dark';
  const resolvedMode  = resolveForDisplay(activeMode);   // "dark" | "light"
  const TriggerIcon   = RESOLVED_ICON[resolvedMode] ?? Moon;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // If system mode is active, re-render when OS preference changes
  useEffect(() => {
    if (activeMode !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = () => {}; // force re-render via state
    const forceUpdate = () => { setOpen(o => o); }; // cheap re-render
    mq.addEventListener('change', forceUpdate);
    return () => mq.removeEventListener('change', forceUpdate);
  }, [activeMode]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        id="theme-picker-trigger"
        onClick={() => setOpen(v => !v)}
        aria-label={`Theme: ${activeMode}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[36px] min-w-[36px] ${
          transparent
            ? 'text-white/80 hover:bg-white/10 hover:text-white border border-white/20'
            : 'text-text-muted hover:bg-surface-2 hover:text-text-primary border border-transparent hover:border-border'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
      >
        {/* Show the resolved icon (sun/moon) so user sees current state */}
        <TriggerIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {/* Show stored mode label (Light / Dark / System) */}
        <span className="hidden sm:inline capitalize text-xs tracking-wide">{activeMode}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Popover */}
      {open && (
        <div
          role="listbox"
          aria-label="Select theme mode"
          className="absolute right-0 top-full mt-2 w-48 z-50 rounded-xl border border-border bg-surface shadow-xl shadow-black/10 overflow-hidden animate-popover-in"
          style={{ animationDuration: '150ms' }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Theme mode</p>
          </div>

          {MODES.map(({ id, label, Icon, desc }) => {
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
                <div className="flex-1 text-left">
                  <div>{label}</div>
                  <div className={`text-[10px] font-normal ${isActive ? 'text-brand/70' : 'text-text-muted'}`}>{desc}</div>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
              </button>
            );
          })}

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border space-y-1">
            {activeMode === 'system' && (
              <p className="text-[10px] text-text-muted leading-tight">
                System resolved to <span className="font-semibold text-text-primary capitalize">{resolvedMode}</span>.
                {resolvedMode === 'light' && (
                  <> If your OS is dark, set Chrome → Appearance → Mode to <span className="font-semibold">Dark</span> or use <span className="font-semibold">Dark</span> mode directly.</>
                )}
              </p>
            )}
            <p className="text-[10px] text-text-muted leading-tight">Synced across all devices.</p>
          </div>
        </div>
      )}
    </div>
  );
}
