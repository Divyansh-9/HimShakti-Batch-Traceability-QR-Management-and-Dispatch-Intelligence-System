/**
 * @fileoverview Role-specific walkthrough content.
 *
 * Split out of WalkthroughTour so the copy can be edited without touching the
 * positioning engine, and so every step can be validated against the tabs a
 * role can actually see.
 *
 * Each step:
 *   id       unique within the role's set
 *   tab      dashboard tab to switch to first; the tour drops the step if the
 *            role cannot see that tab, so a tour never spotlights nothing
 *   selector value of a data-tour="…" attribute
 *   title    short headline
 *   body     what this part of the system is *for* — not what it is called
 *   action   optional concrete thing to try. This is the part that turns a
 *            table of contents into training, so most steps should have one.
 *
 * Anchors currently available: kpi-grid, fefo-table, new-batch-btn, qr-grid,
 * ai-run-btn, notif-bell, import-wizard, inspection-panel, and `<tabId>-tab`
 * for every sidebar entry.
 */

// ── Reusable steps ────────────────────────────────────────────────────
// Several roles need the same explanation. Defining them once keeps the
// wording consistent across tours instead of drifting per copy-paste.

const OVERVIEW_STEP = {
  id: 'overview',
  tab: 'overview',
  selector: 'kpi-grid',
  title: 'Start here every morning',
  body: 'These four cards are the state of the whole operation. "Need Attention" is the one that matters — it counts batches that are urgent or close to expiry right now, recalculated on every load rather than read from a stale field.',
  action: 'Click any status pill under the cards to jump straight into that filtered list.',
};

const FEFO_STEP = {
  id: 'fefo',
  tab: 'fefo',
  selector: 'fefo-table',
  title: 'FEFO decides what ships first',
  body: 'First Expired, First Out. The queue is sorted by how soon stock expires, not by when it was made, so the top row is always the batch that will be wasted first if it sits.',
  action: 'Work top-down. If you skip a row, there should be a reason you can defend.',
};

const QR_STEP = {
  id: 'qr',
  tab: 'qr',
  selector: 'qr-grid',
  title: 'Every batch carries its own trace link',
  body: 'Each QR points at a public trace page showing the product, farmer, village and pack date. Anyone can scan it without logging in — that is the point of a traceability system.',
  action: 'Download the PNG and put it on the carton before it leaves the building.',
};

const NOTIFICATIONS_STEP = {
  id: 'notifications',
  tab: 'overview',
  selector: 'notif-bell',
  title: 'Alerts find you by role',
  body: 'Notifications are routed to your role, not broadcast to everyone. New batches, dispatches, completed inspections and bulk imports each reach the people who act on them.',
  action: 'Open the bell now so you know where it is when it lights up.',
};

const SETTINGS_STEP = {
  id: 'settings',
  tab: 'settings',
  selector: 'settings-tab',
  title: 'Make it yours',
  body: 'Theme, colour palette, typeface and density live here, and they follow your account rather than the browser — sign in anywhere and the dashboard looks the same. Your recent sign-ins are listed here too.',
  action: 'Check the login history occasionally. An entry you do not recognise is worth reporting.',
};

const IMPORT_STEP = {
  id: 'import',
  tab: 'import',
  selector: 'import-wizard',
  title: 'A whole production run at once',
  body: 'Rather than the form one batch at a time, drop in a CSV. Every row is checked and shown to you as "will import", "skip" or "error" before a single record is written, and re-running the same file is safe — duplicates are detected on lot, product and pack date.',
  action: 'Download the template first; it has the exact columns and a filled example row.',
};

// ── Per-role tours ────────────────────────────────────────────────────

export const STEP_SETS = {
  'factory-manager': [
    OVERVIEW_STEP,
    {
      id: 'create-batch',
      tab: 'batches',
      selector: 'new-batch-btn',
      title: 'Logging what came off the line',
      body: 'This is your main job in the system. You supply the product, quantity, yield and pack date — the batch code and the expiry date are worked out for you from the product\'s shelf life, so there is nothing to look up or calculate.',
      action: 'Open the form and read the fields once before you need it under time pressure.',
    },
    {
      id: 'traceability',
      tab: 'batches',
      selector: 'new-batch-btn',
      title: 'The three fields that matter most',
      body: 'Source lot code, farmer and village are what make a batch traceable back to the field. They are snapshotted at creation and never change afterwards, even if the product record is edited later — a recall has to show what was true on the day.',
      action: 'Get the lot code right at entry. Corrections are appended to the batch\'s history, never silently overwritten.',
    },
    IMPORT_STEP,
    FEFO_STEP,
    QR_STEP,
    NOTIFICATIONS_STEP,
  ],

  'quality-inspector': [
    OVERVIEW_STEP,
    {
      id: 'inspection-queue',
      tab: 'fefo',
      selector: 'fefo-table',
      title: 'Let expiry set your queue',
      body: 'Batches nearest expiry are the ones about to ship, so they are the ones worth inspecting first. Red is urgent, amber is a warning.',
      action: 'Inspect from the top of this list rather than in the order batches were created.',
    },
    {
      id: 'inspections',
      tab: 'inspection',
      selector: 'inspection-panel',
      title: 'Your workspace',
      body: 'Inspections are the quality gate. You are the only role that can submit one — everyone from factory manager upward can read them, which is what makes your verdict carry weight.',
      action: 'Open an inspection to see the checklist before your first real one.',
    },
    {
      id: 'inspection-record',
      tab: 'inspection',
      selector: 'inspection-panel',
      title: 'A verdict is a permanent record',
      body: 'Each inspection is stored against its batch and cannot be quietly edited away. Managers are notified the moment you submit, so a failed batch stops moving immediately.',
      action: 'Write the note as if someone will read it a year from now during an audit. They might.',
    },
    {
      id: 'batch-lookup',
      tab: 'batches',
      selector: 'new-batch-btn',
      title: 'Looking up the full record',
      body: 'The batch registry holds everything behind a batch — source lot, farmer, village, pack and expiry dates, and its full note history.',
      action: 'Open any batch row to see its detail drawer before you inspect it.',
    },
    NOTIFICATIONS_STEP,
  ],

  'dispatch-coordinator': [
    OVERVIEW_STEP,
    FEFO_STEP,
    {
      id: 'dispatch',
      tab: 'fefo',
      selector: 'fefo-table',
      title: 'Recording a dispatch',
      body: 'Dispatching from a row marks the batch as shipped, stamps the date and buyer, and takes it out of the active queue for everyone else in real time.',
      action: 'Record the dispatch as it happens, not at the end of the day — the queue others are reading is only as good as this.',
    },
    QR_STEP,
    NOTIFICATIONS_STEP,
  ],

  'manager': [
    OVERVIEW_STEP,
    {
      id: 'batches',
      tab: 'batches',
      selector: 'new-batch-btn',
      title: 'The full registry',
      body: 'Every batch, live and archived. You can create batches, edit traceability notes and correct raw-material details — every change is appended to the batch\'s history with your name on it.',
      action: 'Filter by URGENT to see what your team should be clearing today.',
    },
    FEFO_STEP,
    {
      id: 'inspections',
      tab: 'inspection',
      selector: 'inspection-panel',
      title: 'Quality oversight',
      body: 'You can read every inspection but not submit one — that separation is deliberate, so the record of who passed a batch stays credible.',
      action: 'Check this before signing off a dispatch run.',
    },
    IMPORT_STEP,
    {
      id: 'ai',
      tab: 'ai',
      selector: 'ai-run-btn',
      title: 'A second opinion on dispatch order',
      body: 'The audit reads live inventory and returns a recommended dispatch order with risk flags and notes. Results are cached for four hours, so it is a planning tool rather than something to re-run all day.',
      action: 'Run it before a weekly planning meeting, not before every shipment.',
    },
    QR_STEP,
    NOTIFICATIONS_STEP,
    SETTINGS_STEP,
  ],

  'admin': [
    OVERVIEW_STEP,
    {
      id: 'batches',
      tab: 'batches',
      selector: 'new-batch-btn',
      title: 'Full read-write on the registry',
      body: 'Create, edit, archive and restore. Archiving is a soft delete — records never actually leave the database, because a traceability record you can destroy is not a traceability record.',
      action: 'Anything you archive is recoverable from the archived view.',
    },
    FEFO_STEP,
    IMPORT_STEP,
    {
      id: 'inspections',
      tab: 'inspection',
      selector: 'inspection-panel',
      title: 'Quality records',
      body: 'Read access to every inspection submitted by your quality inspectors, tied to the batch it covers.',
    },
    {
      id: 'ai',
      tab: 'ai',
      selector: 'ai-run-btn',
      title: 'AI dispatch audit',
      body: 'Gemini analyses live stock and returns a structured dispatch recommendation with risk flags. Cached four hours per run.',
      action: 'Treat it as advice. FEFO order is the rule; the audit explains the exceptions.',
    },
    {
      id: 'admin',
      tab: 'admin',
      selector: 'admin-tab',
      title: 'People and access',
      body: 'The user roster, role assignments, access requests and invite links. You can manage every role below your own tier.',
      action: 'Review pending access requests here — nobody gets in until someone approves them.',
    },
    NOTIFICATIONS_STEP,
    SETTINGS_STEP,
  ],

  'super-admin': [
    OVERVIEW_STEP,
    {
      id: 'batches',
      tab: 'batches',
      selector: 'new-batch-btn',
      title: 'The registry, unrestricted',
      body: 'Everything the other roles can do, plus archive and restore. Nothing is ever hard-deleted — archived batches keep their full history and the name of whoever archived them.',
    },
    FEFO_STEP,
    IMPORT_STEP,
    {
      id: 'inspections',
      tab: 'inspection',
      selector: 'inspection-panel',
      title: 'Quality gate',
      body: 'Every inspection ever submitted, tied to its batch. Quality inspectors write them; you and every tier above factory floor can read them.',
    },
    {
      id: 'ai',
      tab: 'ai',
      selector: 'ai-run-btn',
      title: 'AI dispatch audit',
      body: 'Gemini 2.5 Flash reads live inventory and returns a dispatch order with risk flags, falling back to a second provider if it fails. Cached four hours.',
    },
    {
      id: 'admin',
      tab: 'admin',
      selector: 'admin-tab',
      title: 'You hold the controls',
      body: 'Users, roles, access requests and invites. Super Admin is Tier 0 and cannot be granted through this panel — it is set directly on the database on purpose, so nobody can promote themselves.',
      action: 'Everything you do here is attributed to you. That is the point.',
    },
    NOTIFICATIONS_STEP,
    SETTINGS_STEP,
  ],
};

/**
 * Steps for a role, filtered to what that user can actually reach.
 *
 * Without the filter a tour can switch to a tab the sidebar never rendered,
 * leaving the spotlight with no element to attach to and the user staring at
 * a card describing something they cannot see.
 *
 * @param {string}   role
 * @param {string[]} visibleTabIds  ids the dashboard rendered for this user
 */
export function getStepsForRole(role, visibleTabIds) {
  const set = STEP_SETS[role];
  // No guessing: an unknown role gets the universally-visible steps rather
  // than an admin tour promising a panel it cannot open.
  const steps = set || [OVERVIEW_STEP, FEFO_STEP, QR_STEP, NOTIFICATIONS_STEP];

  if (!visibleTabIds?.length) return steps;
  const allowed = new Set(visibleTabIds);
  return steps.filter(s => allowed.has(s.tab));
}
