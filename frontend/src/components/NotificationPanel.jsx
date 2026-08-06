/**
 * NotificationPanel — Phase 3
 *
 * Premium bell-icon dropdown showing role-targeted real-time notifications.
 * Self-contained: manages own open/close state.
 * Consumed from Navbar — just drop in <NotificationPanel />.
 */
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import {
  Bell, BellOff, CheckCheck, Trash2, X,
  Package, Truck, ClipboardCheck, ShieldAlert, Info, Clock, User as UserIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// TYPE → ICON/COLOUR MAP
// ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  batch_created:        { Icon: Package,        colour: 'text-green-500', bg: 'bg-green-500/10'  },
  batch_dispatched:     { Icon: Truck,           colour: 'text-blue-500',  bg: 'bg-blue-500/10'   },
  inspection_completed: { Icon: ClipboardCheck,  colour: 'text-amber-500', bg: 'bg-amber-500/10'  },
  admin_action:         { Icon: ShieldAlert,     colour: 'text-rose-500',  bg: 'bg-rose-500/10'   },
  system:               { Icon: Info,            colour: 'text-text-muted',bg: 'bg-surface-2'     },
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────
// NOTIF ITEM ROW
// ─────────────────────────────────────────────────────────────────
function NotifRow({ notif, onRead }) {
  const cfg  = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
  const Icon = cfg.Icon;
  return (
    <button
      onClick={() => !notif.read && onRead(notif._id)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2/60 border-b border-border last:border-0
        ${!notif.read ? 'bg-brand/[0.04]' : ''}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.colour}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5">
          <p className={`text-xs font-semibold leading-snug ${notif.read ? 'text-text-muted' : 'text-text-primary'}`}>
            {notif.title}
          </p>
          {!notif.read && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand mt-1" />}
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted/60">
          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
          <span>{timeAgo(notif.createdAt)}</span>
          {notif.triggeredBy?.name && notif.triggeredBy.name !== 'System' && (
            <>
              <span>·</span>
              <UserIcon className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{notif.triggeredBy.name}</span>
            </>
          )}
          {notif.refId && (
            <>
              <span>·</span>
              <span className="font-mono text-[9px] bg-surface-2 px-1 py-0.5 rounded">{notif.refId}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function NotificationPanel({ className = '' }) {
  const { notifications, unreadCount, markRead, markAllRead, clearRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const hasRead = notifications.some(n => n.read);

  return (
    <div className={`relative ${className}`} ref={ref}>

      {/* ── Bell trigger ─── */}
      <button
        id="notif-bell-btn"
        data-tour="notif-bell"
        onClick={() => setIsOpen(v => !v)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:bg-surface-2 hover:text-text-primary border border-transparent hover:border-border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-0.5 bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ─── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-[320px] z-50 rounded-xl border border-border bg-surface shadow-2xl shadow-black/15 overflow-hidden animate-popover-in flex flex-col"
          style={{ animationDuration: '150ms', maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-brand" />
              <span className="text-sm font-bold text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {hasRead && (
                <button onClick={clearRead} title="Clear read"
                  className="p-1.5 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} title="Close"
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {isLoading ? (
              <div className="py-10 flex flex-col items-center gap-2 text-text-muted">
                <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 text-text-muted">
                <BellOff className="w-9 h-9 opacity-25" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-text-muted">All clear</p>
                  <p className="text-[10px] text-text-muted/60 mt-0.5 max-w-[180px]">
                    You'll see alerts here when relevant events happen for your role.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map(n => (
                <NotifRow key={n._id} notif={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-surface-2/40 flex-shrink-0">
              <p className="text-[10px] text-text-muted leading-tight">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · Auto-expire after 7 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
