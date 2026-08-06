/**
 * @fileoverview TeamPanel — role channels and the contact directory.
 *
 * Two sub-views answering the same question from opposite ends: "who do I talk
 * to" and "how do I reach them". The directory is gated to manager and above
 * server-side; the sub-tab is hidden below that, and the panel still handles a
 * 403 rather than trusting the client gate.
 *
 * Layout notes, since they were deliberate:
 *  - The role filter is a pill row, not a <select>. A native select renders
 *    with OS chrome that ignores the theme entirely, which looked pasted in.
 *    Six options do not need a dropdown.
 *  - Role filtering is client-side. The directory is a company roster, not a
 *    feed, so one fetch covers it and filtering is instant with accurate
 *    per-role counts. Only search goes to the server.
 *  - A contact with no phone shows a dash, not a sentence. The same explanatory
 *    line repeated down every card was noise; it is stated once, in the footer.
 */
import { useState, useMemo, useEffect } from 'react';
import {
  MessagesSquare, Contact, Search, Phone, Mail, Shield, Copy, Check, Users, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MessageThread from './MessageThread';
import { useChannelList, useChannel, useMessageActions, useDirectory } from '../hooks/useMessages';

const ROLE_LABEL = {
  'admin':                'Admin',
  'manager':              'Manager',
  'factory-manager':      'Factory Manager',
  'quality-inspector':    'Quality Inspector',
  'dispatch-coordinator': 'Dispatch Coordinator',
};

const ROLE_STYLE = {
  'admin':                'bg-rose-500/10 text-rose-400 border-rose-500/25',
  'manager':              'bg-blue-500/10 text-blue-400 border-blue-500/25',
  'factory-manager':      'bg-amber-500/10 text-amber-400 border-amber-500/25',
  'quality-inspector':    'bg-teal-500/10 text-teal-400 border-teal-500/25',
  'dispatch-coordinator': 'bg-green-500/10 text-green-400 border-green-500/25',
};

/**
 * Shorter names for the narrow channel rail. "Dispatch Coordinator" truncates
 * to "Dispatch Coordin…" at 200px, which is worse than just saying "Dispatch";
 * the full name is still in the pane header.
 */
const RAIL_LABEL = {
  'admin':                'Admin',
  'manager':              'Manager',
  'factory-manager':      'Factory',
  'quality-inspector':    'Quality',
  'dispatch-coordinator': 'Dispatch',
};

const ROLE_DOT = {
  'admin':                'bg-rose-400',
  'manager':              'bg-blue-400',
  'factory-manager':      'bg-amber-400',
  'quality-inspector':    'bg-teal-400',
  'dispatch-coordinator': 'bg-green-400',
};

/** A few legacy accounts predate `name` being required on the schema. */
function contactName(c) {
  return c.name?.trim() || c.username || 'Unknown user';
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

// ── Channels ──────────────────────────────────────────────────────────

function relativeDay(iso) {
  if (!iso) return null;
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function ChannelsView() {
  const { data: info, isLoading: listLoading, error } = useChannelList();
  const channels = useMemo(() => info?.channels ?? [], [info]);
  const [active, setActive] = useState(null);
  const current = active || channels[0] || null;

  const { messages, isLoading, post } = useChannel(current, !!current);
  const { edit, remove } = useMessageActions(['messages', 'channel', current]);

  /**
   * Unread marks, kept in localStorage.
   *
   * There is no per-user read state on the server and adding one would mean a
   * write on every channel open. "Newer than the last time *this browser*
   * opened it" is honest about what it measures and costs nothing.
   */
  // Snapshot taken once, when the panel opens, and never updated during the
  // session. Marks are compared against this rather than against live state,
  // so a channel does not lose its unread dot the instant you glance at the
  // rail — it clears on the next visit, which is what you would expect.
  const [seen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hs_channel_seen') || '{}'); }
    catch { return {}; }
  });

  // Writing the mark is a side effect on an external store, not React state.
  useEffect(() => {
    if (!current) return;
    try {
      const store = JSON.parse(localStorage.getItem('hs_channel_seen') || '{}');
      store[current] = new Date().toISOString();
      localStorage.setItem('hs_channel_seen', JSON.stringify(store));
    } catch { /* private mode or quota — unread marks are not worth failing over */ }
  }, [current, messages.length]);

  if (listLoading) return <p className="text-xs text-text-muted py-6">Loading channels…</p>;
  if (error)       return <p className="text-xs text-error py-6">{error.message}</p>;
  if (!channels.length) {
    return <p className="text-xs text-text-muted py-6">Your role has no channel assigned.</p>;
  }

  const members = info?.memberCounts?.[current] ?? 0;
  const label   = ROLE_LABEL[current] || current;

  return (
    <div className="grid gap-0 lg:grid-cols-[200px_1fr] lg:divide-x divide-border -m-4">
      {/* ── Rail: an inbox, not a menu ── */}
      <div className="p-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted px-2 pb-2 pt-1">
          Channels
        </p>
        <div className="space-y-0.5">
          {channels.map(role => {
            const on   = current === role;
            const act  = info?.activity?.[role];
            const n    = info?.memberCounts?.[role] ?? 0;
            const unread = act?.lastAt && !on && new Date(act.lastAt) > new Date(seen[role] || 0);
            return (
              <button
                key={role}
                onClick={() => setActive(role)}
                className={`press relative w-full text-left px-2.5 py-2 rounded-xl duration-[240ms] motion-quint ${
                  on ? 'bg-brand/10' : 'hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {unread && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
                  <Hash className={`w-3 h-3 flex-shrink-0 ${on ? 'text-brand' : 'text-text-muted opacity-50'}`} />
                  <span
                    className={`truncate text-xs ${unread ? 'font-bold text-text-primary' : on ? 'font-semibold text-brand' : 'font-medium text-text-primary'}`}
                    title={ROLE_LABEL[role] || role}
                  >
                    {RAIL_LABEL[role] || ROLE_LABEL[role] || role}
                  </span>
                  <span className="ml-auto text-[10px] tabular-nums text-text-muted flex-shrink-0">
                    {act?.lastAt ? relativeDay(act.lastAt) : ''}
                  </span>
                </div>

                {/* Preview line — the reason an inbox beats a nav list. */}
                <p className="text-[10.5px] text-text-muted truncate mt-0.5 pl-[18px] leading-snug">
                  {act?.lastBody
                    ? <><span className="opacity-70">{act.lastAuthor?.split(' ')[0]}:</span> {act.lastBody}</>
                    : <span className="opacity-50 inline-flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />{n} {n === 1 ? 'member' : 'members'} · no messages
                      </span>}
                </p>
              </button>
            );
          })}
        </div>
        {info?.isSuperAdmin && (
          <p className="text-[10px] text-text-muted px-2.5 pt-3 mt-2 leading-snug border-t border-border">
            Every channel is visible to you because Super Admin is Tier&nbsp;0.
            Everyone else sees only their own.
          </p>
        )}
      </div>

      {/* ── Conversation ──
          Height adapts to *readable* messages, not row count. A channel whose
          only history is a deleted tombstone was reserving 620px to display
          one line of grey italic. */}
      <div className={`flex flex-col min-h-0 ${messages.some(m => !m.isDeleted) ? 'h-[min(64vh,620px)]' : ''}`}>
        {/* Channel header — gives the pane context instead of opening on a void */}
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
          <Hash className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[13px] font-semibold text-text-primary">{label}</span>
          <span className="text-[11px] text-text-muted flex items-center gap-1 ml-1">
            <Users className="w-3 h-3" /> {members}
          </span>
          <span className="ml-auto text-[10px] text-text-muted">
            {info?.retentionDays ?? 90}-day history
          </span>
        </div>

        <div className="flex-1 min-h-0 px-3 pb-3 pt-1 flex flex-col">
          <MessageThread
            messages={messages}
            isLoading={isLoading}
            sending={post.isPending}
            onSend={(body) => post.mutateAsync(body)}
            onEdit={(id, body) => edit.mutateAsync({ id, body })}
            onDelete={(id) => remove.mutateAsync(id)}
            placeholder={`Message #${label}…`}
            emptyTitle={`This is #${label}`}
            emptyHint={`${members} ${members === 1 ? 'person' : 'people'} in this channel. Shift handovers and coordination go here — decisions about a batch belong on the batch.`}
          />
        </div>
      </div>
    </div>
  );
}

// ── Directory ─────────────────────────────────────────────────────────

function CopyButton({ value, label }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true); setTimeout(() => setDone(false), 1500);
        } catch { toast.error('Could not copy'); }
      }}
      aria-label={`Copy ${label}`}
      className="ml-auto opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity text-text-muted hover:text-brand flex-shrink-0"
    >
      {done ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ContactRow({ Icon, value, href, label }) {
  return (
    <div className="group/row flex items-center gap-2 text-[11px] min-w-0">
      <Icon className="w-3 h-3 flex-shrink-0 text-text-muted" />
      {value ? (
        <>
          <a href={href} className="truncate text-text-muted hover:text-brand transition-colors">{value}</a>
          <CopyButton value={value} label={label} />
        </>
      ) : (
        <span className="text-text-muted opacity-40">—</span>
      )}
    </div>
  );
}

function DirectoryView() {
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('');
  // Search hits the server; role filtering is local so the counts stay honest.
  const { data, isLoading, error } = useDirectory({ search });

  const all = useMemo(() => data?.contacts ?? [], [data]);
  const counts = useMemo(() => all.reduce((acc, c) => {
    acc[c.role] = (acc[c.role] || 0) + 1;
    return acc;
  }, {}), [all]);
  const contacts = useMemo(
    () => (role ? all.filter(c => c.role === role) : all),
    [all, role]
  );

  if (error) {
    const denied = /manager-level/i.test(error.message);
    return (
      <div className="p-5 rounded-xl border border-error/25 bg-error/5 text-error text-sm">
        {denied ? 'The team directory is available to managers and above.' : error.message}
      </div>
    );
  }

  const FILTERS = [
    { id: '', label: 'Everyone', n: all.length },
    ...Object.keys(ROLE_LABEL)
      .filter(r => counts[r])
      .map(r => ({ id: r, label: ROLE_LABEL[r], n: counts[r] })),
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email or phone…"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Pills instead of a native select — a themed control, and the counts
          are useful information a dropdown would have hidden. */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id || 'all'}
            onClick={() => setRole(f.id)}
            className={`press px-3 py-1 rounded-full text-[11px] font-semibold border duration-[240ms] motion-quint ${
              role === f.id
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
            }`}
          >
            {f.label} <span className="opacity-50">{f.n}</span>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-xs text-text-muted py-6">Loading directory…</p>}
      {!isLoading && !contacts.length && (
        <p className="text-xs text-text-muted py-10 text-center">No one matches that search.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {contacts.map(c => {
          const nm = contactName(c);
          return (
            <div
              key={c._id}
              className="p-3 rounded-2xl border border-border bg-surface-2/30 hover:bg-surface-2/60 hover:border-brand/25 hover:-translate-y-[1px] transition-[background-color,border-color,transform] duration-[240ms] motion-quint"
            >
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg grid place-items-center text-[11px] font-bold flex-shrink-0 border ${ROLE_STYLE[c.role] || 'bg-surface-2 text-text-muted border-border'}`}>
                  {initials(nm)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate">{nm}</p>
                    {c.isSuperAdmin && (
                      <Shield className="w-3 h-3 text-purple-400 flex-shrink-0" title="Super Admin — Tier 0" />
                    )}
                    {!c.isActive && (
                      <span className="text-[9px] px-1 py-px rounded bg-surface-2 text-text-muted border border-border flex-shrink-0">
                        inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ROLE_DOT[c.role] || 'bg-border'}`} />
                    <span className="text-[10px] text-text-muted truncate">
                      {ROLE_LABEL[c.role] || c.role} · @{c.username}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-border/60 space-y-1">
                <ContactRow Icon={Mail}  value={c.email} href={`mailto:${c.email}`} label="email" />
                <ContactRow Icon={Phone} value={c.phone} href={`tel:${c.phone}`}   label="phone" />
              </div>
            </div>
          );
        })}
      </div>

      {!!contacts.length && (
        <p className="text-[10px] text-text-muted pt-1">
          {contacts.length} {contacts.length === 1 ? 'person' : 'people'} · a dash means nothing on
          file. Phone numbers are self-managed in Settings — nobody can enter one for someone else.
        </p>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────

export default function TeamPanel({ canSeeDirectory }) {
  const [view, setView] = useState('channels');

  const TABS = [
    { id: 'channels',  label: 'Channels',  Icon: MessagesSquare, show: true },
    { id: 'directory', label: 'Directory', Icon: Contact,        show: canSeeDirectory },
  ].filter(t => t.show);

  return (
    // Double bezel: the tray carries the hairline, the plate carries the
    // content and its own inner highlight. Concentric radii, not two
    // unrelated rounded rectangles.
    <div className="bezel">
      <div className="bezel-core">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-wrap">
          <Users className="w-3.5 h-3.5 text-brand" />
          <h2 className="text-xs font-semibold text-text-primary">Team</h2>

          {TABS.length > 1 && (
            <div className="ml-auto flex gap-0.5 p-0.5 rounded-full bg-surface-2 border border-border">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`press inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold duration-[240ms] motion-quint ${
                    view === id
                      ? 'bg-brand text-white'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          {view === 'channels'  && <ChannelsView />}
          {view === 'directory' && canSeeDirectory && <DirectoryView />}
        </div>
      </div>
    </div>
  );
}
