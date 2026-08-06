/**
 * @fileoverview MessageThread — the shared conversation UI.
 *
 * Used for record threads (in BatchDetailDrawer) and role channels (Team tab).
 *
 * Four mechanics do the heavy lifting, and they are the same ones every
 * modern chat surface uses:
 *
 *  1. Grouping. Consecutive messages from one author inside a short window
 *     collapse into a single block — one avatar, one name, one timestamp.
 *     Repeating the header on every line is the single thing that makes a
 *     conversation read like a 2009 forum thread.
 *  2. Date separators, so a long scroll has landmarks.
 *  3. A borderless surface. The conversation is space, not a boxed field.
 *     Nesting a bordered list inside a bordered panel inside a bordered card
 *     is what reads as "old web form".
 *  4. A composer that floats — one rounded bar, send inline, auto-growing —
 *     rather than a raw textarea with a button parked beside it.
 */
import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { Send, Pencil, Trash2, Check, X, Loader2, MessageSquare } from 'lucide-react';

/** Consecutive messages from one author within this window group together. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const ROLE_STYLE = {
  'admin':                'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'super-admin':          'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'manager':              'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'factory-manager':      'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'quality-inspector':    'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'dispatch-coordinator': 'bg-green-500/15 text-green-300 border-green-500/30',
};

/**
 * Sender-name tint, keyed to the person.
 *
 * First attempt keyed this to the role — which is useless in a role channel,
 * because every member there has the same role and every name came out the
 * same colour. Hashing the author id gives each person a stable hue that
 * actually distinguishes them, and the role still appears as text beside the
 * name for anyone who needs it.
 */
const SENDER_TINTS = [
  'text-rose-400', 'text-blue-400', 'text-amber-400', 'text-teal-400',
  'text-green-400', 'text-purple-400', 'text-cyan-400', 'text-orange-400',
];

function senderTint(id) {
  const key = String(id || '');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return SENDER_TINTS[h % SENDER_TINTS.length];
}

/** Names are required by the schema but a few legacy rows have none. */
const displayName = (m) => m.authorName?.trim() || 'Unknown user';

const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

function clockTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yest  = new Date(); yest.setDate(today.getDate() - 1);
  const same  = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yest))  return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

/**
 * Fold a flat message list into render rows: date separators, group heads
 * (avatar + name + role) and continuation lines (body only).
 */
function buildRows(messages) {
  const rows = [];
  let lastDay = null;
  let prev = null;

  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== lastDay) {
      rows.push({ kind: 'day', key: `d-${day}`, at: m.createdAt });
      lastDay = day;
      prev = null;
    }
    const grouped =
      prev &&
      prev.authorId === m.authorId &&
      !prev.isDeleted && !m.isDeleted &&
      (new Date(m.createdAt) - new Date(prev.createdAt)) < GROUP_WINDOW_MS;

    rows.push({ kind: grouped ? 'cont' : 'head', key: m._id, m });
    prev = m;
  }
  return rows;
}

// ── One message ───────────────────────────────────────────────────────

function MessageRow({ m, head, onEdit, onDelete, busy }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(m.body || '');

  const mine = m.mine;
  const name = displayName(m);

  if (m.isDeleted) {
    return (
      <div className={`flex px-3 py-0.5 ${mine ? 'justify-end' : ''}`}>
        <span className="text-[11px] italic text-text-muted opacity-50 bg-surface-2/50 rounded-md px-2 py-1">
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <div className={`group flex gap-1.5 px-3 ${head ? 'pt-2' : 'pt-[3px]'} ${mine ? 'flex-row-reverse' : ''}`}>
      {/* Own messages carry no avatar — you know who you are, and dropping it
          gives the bubble back the gutter. Incoming continuations keep an
          empty gutter so a run stays in one column. */}
      {mine ? null : head ? (
        <div className={`w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold flex-shrink-0 border ${ROLE_STYLE[m.authorRole] || 'bg-surface-2 text-text-muted border-border'}`}>
          {initials(name)}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      <div className={`min-w-0 max-w-[68%] flex ${mine ? 'justify-end' : ''}`}>
        {editing ? (
          <div className="space-y-2 py-1 w-full min-w-[240px]">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              maxLength={2000}
              autoFocus
              className="w-full px-2.5 py-2 rounded-lg bg-surface border border-brand/40 text-[13px] text-text-primary focus:outline-none resize-y"
            />
            <div className="flex gap-1.5">
              <button
                onClick={async () => { await onEdit(m._id, draft.trim()); setEditing(false); }}
                disabled={!draft.trim() || draft.trim() === m.body || busy}
                className="press inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand text-white text-[11px] font-semibold disabled:opacity-50">
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                onClick={() => { setDraft(m.body); setEditing(false); }}
                className="press inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-text-primary">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex items-start gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
            <div
              className={`bubble px-2.5 py-1.5 shadow-sm ${mine ? 'bubble-out bg-brand text-white' : 'bubble-in text-text-primary'} ${head ? 'bubble-tail' : ''}`}
              style={mine ? undefined : { background: 'var(--bubble-bg)' }}
            >
              {/* Sender name lives inside the bubble, tinted per person so
                  two people in the same role stay distinguishable. */}
              {head && !mine && (
                <p className={`text-[11px] font-semibold leading-tight mb-0.5 ${senderTint(m.authorId)}`}>
                  {name}
                  <span className="font-normal text-text-muted"> · {m.authorRole}</span>
                </p>
              )}

              <p className="text-[13px] leading-[1.45] whitespace-pre-wrap break-words">
                {m.body}
                {/* Floated so the last line of text wraps around the time
                    rather than the time taking a row of its own. */}
                <span className={`bubble-time ${mine ? 'text-white/60' : 'text-text-muted'}`}>
                  {m.editCount > 0 && (
                    <span className="italic mr-1"
                      title={`Edited ${m.editCount} time${m.editCount === 1 ? '' : 's'} — earlier versions are kept`}>
                      edited
                    </span>
                  )}
                  {clockTime(m.createdAt)}
                </span>
              </p>
            </div>

            {/* Hover actions ride beside the bubble so nothing reflows. */}
            {mine && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0 pt-1">
                <button onClick={() => { setDraft(m.body); setEditing(true); }}
                  aria-label="Edit message"
                  className="p-1 rounded text-text-muted hover:text-brand hover:bg-surface-2">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => onDelete(m._id)}
                  aria-label="Delete message"
                  className="p-1 rounded text-text-muted hover:text-error hover:bg-surface-2">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Thread ────────────────────────────────────────────────────────────

export default function MessageThread({
  messages, isLoading, onSend, onEdit, onDelete,
  sending = false, placeholder = 'Write a message…',
  emptyTitle = 'No messages yet',
  emptyHint = '',
  footnote = null,
  autoScroll = true,
}) {
  const [draft, setDraft] = useState('');
  const endRef  = useRef(null);
  const taRef   = useRef(null);

  const rows = useMemo(() => buildRows(messages), [messages]);

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, autoScroll]);

  // Auto-grow the composer to its content, capped so it cannot swallow the
  // conversation. Layout effect so it never paints at the wrong height.
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [draft]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    await onSend(body);
    setDraft('');
  }

  const nearLimit = draft.length > 1800;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Conversation canvas — its own surface, distinct from the panel.
          Texture sits on this wrapper; the scroll container inside stays
          transparent so the pattern is painted once, not every frame. */}
      <div className="chat-canvas flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {isLoading && (
          <p className="text-xs text-text-muted flex items-center gap-2 px-2 py-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
          </p>
        )}

        {!isLoading && !rows.length && (
          <div className="h-full min-h-[180px] grid place-items-center text-center px-6">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-surface-2 border border-border grid place-items-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5 text-text-muted opacity-50" />
              </div>
              <p className="text-[13px] font-semibold text-text-primary">{emptyTitle}</p>
              {emptyHint && (
                <p className="text-xs text-text-muted mt-1 max-w-[260px] leading-relaxed">{emptyHint}</p>
              )}
            </div>
          </div>
        )}

        {rows.map(r =>
          r.kind === 'day' ? (
            // Centred pill rather than a rule across the pane — a landmark
            // that does not read as a divider between two separate sections.
            <div key={r.key} className="flex justify-center py-3 select-none sticky top-0 z-10">
              <span className="text-[10px] font-semibold text-text-muted bg-surface-2 border border-border rounded-full px-2.5 py-1 shadow-sm">
                {dayLabel(r.at)}
              </span>
            </div>
          ) : (
            <MessageRow
              key={r.key}
              m={r.m}
              head={r.kind === 'head'}
              onEdit={onEdit}
              onDelete={onDelete}
              busy={sending}
            />
          )
        )}
        <div ref={endRef} />
      </div>
      </div>

      {/* Composer — one raised bar, send inline. */}
      <div className="pt-3 flex-shrink-0">
        <div className="flex items-end gap-2 rounded-2xl bg-surface-2 border border-border px-3 py-2 focus-within:border-brand/50 transition-colors">
          <textarea
            ref={taRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              // Enter sends, Shift+Enter breaks the line — the convention
              // everyone already has muscle memory for.
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={1}
            maxLength={2000}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none resize-none py-1 leading-relaxed"
          />
          {nearLimit && (
            <span className={`text-[10px] tabular-nums self-center ${draft.length >= 2000 ? 'text-error' : 'text-text-muted'}`}>
              {2000 - draft.length}
            </span>
          )}
          {/* Nested icon well rather than a bare glyph: the circle is its own
              surface inside the button, and it translates on hover so the
              control has internal kinetic tension instead of a colour swap. */}
          <button
            onClick={submit}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="group press w-8 h-8 rounded-full bg-brand text-white hover:bg-brand-hover disabled:opacity-30 disabled:hover:bg-brand grid place-items-center flex-shrink-0 mb-0.5 duration-[240ms] motion-quint">
            <span className="w-5 h-5 rounded-full bg-white/15 grid place-items-center transition-transform duration-[240ms] motion-spring group-hover:translate-x-[1px] group-hover:-translate-y-[1px] group-hover:scale-105 group-disabled:transform-none">
              {sending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Send className="w-3 h-3" />}
            </span>
          </button>
        </div>
        {footnote && (
          <p className="text-[10px] text-text-muted mt-1.5 px-1">{footnote}</p>
        )}
      </div>
    </div>
  );
}
