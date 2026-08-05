// src/components/WalkthroughTour.jsx
// ── Guided spotlight tour engine ───────────────────────────────────
// Pure React + CSS — no external libraries.
// Reads role from user prop, picks the matching step set,
// auto-navigates tabs, measures DOM targets, positions spotlight + card.
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useWalkthrough } from '../context/WalkthroughContext';

// ── Role-specific step definitions ────────────────────────────────
// selector: data-tour="<id>" attribute value on the target element
// tab: which dashboard tab to switch to first
// cardSide: preferred card position relative to spotlight ('bottom'|'top'|'right'|'left')
const STEP_SETS = {
  'super-admin': [
    {
      id: 'overview',
      tab: 'overview',
      title: 'Your command centre',
      description: 'The Overview gives you a live snapshot — total batches, active stock, dispatched shipments, and items needing urgent attention across all product lines.',
      selector: 'kpi-grid',
      cardSide: 'bottom',
    },
    {
      id: 'batches',
      tab: 'batches',
      title: 'Every batch, one place',
      description: 'Create, track, and manage all batches here. Search, sort by expiry, filter by status, or archive old records. You have full read-write access.',
      selector: 'new-batch-btn',
      cardSide: 'bottom',
    },
    {
      id: 'fefo',
      tab: 'fefo',
      title: 'Ship the right box first',
      description: 'FEFO (First Expired, First Out) sorts your inventory by expiry urgency. The top row is what needs to leave today — no guesswork.',
      selector: 'fefo-table',
      cardSide: 'top',
    },
    {
      id: 'qr',
      tab: 'qr',
      title: 'Traceability at a scan',
      description: 'Every batch gets a unique QR code. Scan from any phone to see the full consumer-facing trace page — farmer, origin, batch date, and more.',
      selector: 'qr-grid',
      cardSide: 'top',
    },
    {
      id: 'ai',
      tab: 'ai',
      title: 'AI that thinks ahead',
      description: 'Gemini 2.5 Flash analyses live inventory and gives you an exact dispatch recommendation, risk flags, and notes. Results are cached for 4 hours.',
      selector: 'ai-run-btn',
      cardSide: 'bottom',
    },
    {
      id: 'admin',
      tab: 'admin',
      title: 'Super Admin holds the controls',
      description: `Users, roles, access requests, and invite links all live here. You're the only one with full control over this panel.`,
      selector: 'admin-tab',
      cardSide: 'right',
    },
  ],

  'admin': [
    {
      id: 'overview',
      tab: 'overview',
      title: 'Your operations at a glance',
      description: 'The Overview gives you a live snapshot — total batches, stock health, dispatch count, and items that need your attention.',
      selector: 'kpi-grid',
      cardSide: 'bottom',
    },
    {
      id: 'batches',
      tab: 'batches',
      title: 'Batch management hub',
      description: 'Create, edit, and manage all batch records. Sort by expiry, filter by status, and dispatch directly from this table.',
      selector: 'new-batch-btn',
      cardSide: 'bottom',
    },
    {
      id: 'fefo',
      tab: 'fefo',
      title: 'Priority dispatch queue',
      description: 'FEFO ensures the soonest-to-expire batch ships first. Review this queue before every dispatch cycle.',
      selector: 'fefo-table',
      cardSide: 'top',
    },
    {
      id: 'qr',
      tab: 'qr',
      title: 'QR traceability layer',
      description: 'Auto-generated QR codes link every batch to a public trace page. Download and print them for labelling.',
      selector: 'qr-grid',
      cardSide: 'top',
    },
    {
      id: 'ai',
      tab: 'ai',
      title: 'AI-powered dispatch audit',
      description: 'Get instant Gemini AI recommendations on which batches to dispatch, with risk analysis and structured notes.',
      selector: 'ai-run-btn',
      cardSide: 'bottom',
    },
    {
      id: 'admin',
      tab: 'admin',
      title: 'Admin panel',
      description: 'Manage users, approve access requests, and send invite links. You can manage all roles below your own tier.',
      selector: 'admin-tab',
      cardSide: 'right',
    },
  ],

  'manager': [
    {
      id: 'overview',
      tab: 'overview',
      title: 'Your operations snapshot',
      description: `Get an instant read on inventory health — total batches, what's active, dispatched counts, and anything that needs action.`,
      selector: 'kpi-grid',
      cardSide: 'bottom',
    },
    {
      id: 'batches',
      tab: 'batches',
      title: 'Full batch visibility',
      description: 'Browse all batch records, filter by status, and sort by expiry. You can create batches and initiate dispatches from here.',
      selector: 'new-batch-btn',
      cardSide: 'bottom',
    },
    {
      id: 'fefo',
      tab: 'fefo',
      title: 'Dispatch priority queue',
      description: 'The FEFO queue tells you exactly which batches should ship next. Review before approving any dispatch.',
      selector: 'fefo-table',
      cardSide: 'top',
    },
    {
      id: 'qr',
      tab: 'qr',
      title: 'QR code centre',
      description: 'Download and manage QR codes for all batches. Each code gives customers a full trace of their product.',
      selector: 'qr-grid',
      cardSide: 'top',
    },
    {
      id: 'ai',
      tab: 'ai',
      title: 'AI dispatch intelligence',
      description: 'Run the Gemini AI audit to get structured dispatch recommendations with risk flags. Great for weekly planning.',
      selector: 'ai-run-btn',
      cardSide: 'bottom',
    },
  ],

  'factory-manager': [
    {
      id: 'overview',
      tab: 'overview',
      title: 'Your warehouse at a glance',
      description: 'See total batches, active stock, and dispatch counts. The "Need Attention" card shows which batches are expiring soon.',
      selector: 'kpi-grid',
      cardSide: 'bottom',
    },
    {
      id: 'batches',
      tab: 'batches',
      title: 'Create and track batches',
      description: 'This is where you log new batches coming off the production line. Hit "New Batch" to get started — fill in product, farmer, weight, and expiry.',
      selector: 'new-batch-btn',
      cardSide: 'bottom',
    },
    {
      id: 'fefo',
      tab: 'fefo',
      title: 'Expiry priority view',
      description: 'FEFO ranks all your batches by how soon they expire. Keep an eye on the top rows — those need to ship first.',
      selector: 'fefo-table',
      cardSide: 'top',
    },
  ],

  'quality-inspector': [
    {
      id: 'overview',
      tab: 'overview',
      title: 'Inventory health dashboard',
      description: 'Monitor batch counts and see at a glance how many batches are in urgent, warning, or ready state across all product lines.',
      selector: 'kpi-grid',
      cardSide: 'bottom',
    },
    {
      id: 'batches',
      tab: 'batches',
      title: 'Batch status at a glance',
      description: 'Browse all active batch records. Filter by URGENT or WARNING to quickly find batches that need your quality review.',
      selector: 'fefo-table',
      cardSide: 'bottom',
    },
    {
      id: 'fefo',
      tab: 'fefo',
      title: 'Expiry urgency tracker',
      description: 'The FEFO queue shows expiry-sorted batches. Red = urgent action needed. Use this to prioritise your inspection schedule.',
      selector: 'fefo-table',
      cardSide: 'top',
    },
  ],

  'dispatch-coordinator': [
    {
      id: 'overview',
      tab: 'overview',
      title: 'Dispatch operations hub',
      description: 'Track dispatched shipments and see which batches are ready to go. The KPI cards give you an instant read on inventory state.',
      selector: 'kpi-grid',
      cardSide: 'bottom',
    },
    {
      id: 'fefo',
      tab: 'fefo',
      title: 'Your dispatch queue',
      description: 'FEFO is your primary workspace — it ranks batches by expiry urgency. Always dispatch from the top of this list.',
      selector: 'fefo-table',
      cardSide: 'top',
    },
    {
      id: 'qr',
      tab: 'qr',
      title: 'QR codes for labelling',
      description: 'Download the QR for each dispatched batch and attach it to the shipment. Customers can scan it to trace the product back to its source.',
      selector: 'qr-grid',
      cardSide: 'top',
    },
  ],
};

// Fallback for roles not in the map
function getSteps(role) {
  return STEP_SETS[role] || STEP_SETS['admin'];
}

// ── Helper: find and measure a data-tour element ───────────────────
function measureTarget(selectorId) {
  const el = document.querySelector(`[data-tour="${selectorId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top:    rect.top    + window.scrollY,
    left:   rect.left   + window.scrollX,
    width:  rect.width,
    height: rect.height,
    el,
  };
}

// ── Spotlight overlay ──────────────────────────────────────────────
function Spotlight({ target, padding = 10 }) {
  if (!target) return null;
  const { top, left, width, height } = target;
  const t = top    - padding;
  const l = left   - padding;
  const w = width  + padding * 2;
  const h = height + padding * 2;

  return (
    <>
      {/* Dark overlay with a transparent hole cut out */}
      <div className="tour-backdrop" aria-hidden="true" />
      {/* Glowing ring around the target */}
      <div
        className="tour-spotlight-ring"
        style={{ top: t, left: l, width: w, height: h }}
        aria-hidden="true"
      />
    </>
  );
}

// ── Card positioning logic ─────────────────────────────────────────
const CARD_WIDTH  = 320;
const CARD_HEIGHT = 200; // approximate; actual is dynamic
const PAD         = 18;

function computeCardStyle(target, cardSide) {
  if (!target) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { top, left, width, height } = target;
  const PADDING = 10; // spotlight padding

  let style = {};

  if (cardSide === 'bottom') {
    style.top  = top + height + PADDING + PAD;
    style.left = Math.min(Math.max(left, PAD), vw - CARD_WIDTH - PAD);
  } else if (cardSide === 'top') {
    style.top  = top - PADDING - CARD_HEIGHT - PAD;
    style.left = Math.min(Math.max(left, PAD), vw - CARD_WIDTH - PAD);
  } else if (cardSide === 'right') {
    style.top  = Math.min(top, vh - CARD_HEIGHT - PAD);
    style.left = left + width + PADDING + PAD;
  } else {
    // left
    style.top  = Math.min(top, vh - CARD_HEIGHT - PAD);
    style.left = left - CARD_WIDTH - PADDING - PAD;
  }

  // Clamp to viewport
  style.top  = Math.max(PAD, Math.min(style.top,  vh - CARD_HEIGHT - PAD));
  style.left = Math.max(PAD, Math.min(style.left, vw - CARD_WIDTH  - PAD));

  return style;
}

// ── Step dot indicator ─────────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div className="tour-dots" role="tablist" aria-label="Tour progress">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          role="tab"
          aria-selected={i === current}
          className={`tour-dot ${i === current ? 'tour-dot--active' : i < current ? 'tour-dot--done' : ''}`}
        />
      ))}
    </div>
  );
}

// ── Main WalkthroughTour component ────────────────────────────────
export default function WalkthroughTour({ userRole }) {
  const {
    isActive, stepIndex, stopTour, nextStep, prevStep, switchTab,
  } = useWalkthrough();

  const steps    = getSteps(userRole);
  const total    = steps.length;
  const step     = steps[stepIndex];
  const isLast   = stepIndex === total - 1;

  const [target,    setTarget]    = useState(null);
  const [cardStyle, setCardStyle] = useState({});
  const [visible,   setVisible]   = useState(false);
  const measureTimerRef           = useRef(null);

  // ── Navigate tab + measure target when step changes ────────────
  const remeasure = useCallback(() => {
    if (!isActive || !step) return;
    // Switch tab first
    switchTab(step.tab);

    // Wait for tab content to render, then measure
    clearTimeout(measureTimerRef.current);
    measureTimerRef.current = setTimeout(() => {
      const t = measureTarget(step.selector);
      setTarget(t);
      setCardStyle(computeCardStyle(t, step.cardSide));
      setVisible(true);
      // Scroll the target into view if needed
      t?.el?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }, 380);
  }, [isActive, step, switchTab]);

  useEffect(() => {
    if (!isActive) { setVisible(false); return; }
    setVisible(false);
    remeasure();
    return () => clearTimeout(measureTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    function onKey(e) {
      if (e.key === 'Escape')     stopTour();
      if (e.key === 'ArrowRight') nextStep(total);
      if (e.key === 'ArrowLeft')  prevStep();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, stopTour, nextStep, prevStep, total]);

  if (!isActive || !step) return null;

  return (
    <>
      {/* Spotlight backdrop + ring */}
      <Spotlight target={target} />

      {/* Tour card */}
      <div
        className={`tour-card ${visible ? 'tour-card--visible' : ''}`}
        style={{ ...cardStyle, position: 'fixed', zIndex: 9999, width: CARD_WIDTH }}
        role="dialog"
        aria-modal="false"
        aria-label={`Tour step ${stepIndex + 1} of ${total}: ${step.title}`}
      >
        {/* Header row */}
        <div className="tour-card-header">
          <span className="tour-card-step-label">
            STEP {stepIndex + 1} OF {total}
          </span>
          <button
            onClick={stopTour}
            className="tour-card-close"
            aria-label="Close tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title + description */}
        <h3 className="tour-card-title">{step.title}</h3>
        <p className="tour-card-desc">{step.description}</p>

        {/* Footer: dots + nav buttons */}
        <div className="tour-card-footer">
          <StepDots total={total} current={stepIndex} />
          <div className="tour-card-nav">
            {stepIndex > 0 && (
              <button
                onClick={prevStep}
                className="tour-btn tour-btn--back"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={stopTour}
                className="tour-btn tour-btn--done"
                aria-label="Finish tour"
                id="tour-done-btn"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Done
              </button>
            ) : (
              <button
                onClick={() => nextStep(total)}
                className="tour-btn tour-btn--next"
                aria-label="Next step"
                id="tour-next-btn"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
