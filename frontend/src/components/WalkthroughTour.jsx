// src/components/WalkthroughTour.jsx
// ── Guided spotlight tour engine ───────────────────────────────────
// Pure React + CSS — no external libraries.
//
// Content lives in config/walkthroughSteps.js. This file only does the hard
// part: getting a spotlight onto an element that may not exist yet.
//
// Three things it does that a naive implementation does not:
//
//  1. Waits for the target instead of guessing. Switching tabs re-renders and
//     may refetch, so a fixed timeout races the data. It polls for the element
//     and only gives up after a deadline.
//  2. Measures the card rather than assuming a height. A hardcoded estimate
//     puts long steps off-screen when the card is positioned above a target.
//  3. Degrades honestly. If the element genuinely is not there, the step is
//     centred and says so, instead of showing a floating card pointing at
//     nothing.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, Lightbulb } from 'lucide-react';
import { useWalkthrough } from '../context/WalkthroughContext';
import { getStepsForRole } from '../config/walkthroughSteps';

const CARD_WIDTH   = 340;
const PAD          = 18;   // gap between spotlight and card
const SPOT_PADDING = 10;   // halo around the target
const FALLBACK_CARD_HEIGHT = 220;

// How long to wait for a tab's content to render before declaring the target
// missing. Generous, because the tab may be fetching.
const TARGET_TIMEOUT_MS  = 2500;
const TARGET_POLL_MS     = 80;

/**
 * Resolve a data-tour element, polling until it appears or the deadline
 * passes. Returns null rather than throwing so the caller can degrade.
 */
function waitForTarget(selectorId, cancelledRef) {
  return new Promise(resolve => {
    const start = performance.now();
    (function poll() {
      if (cancelledRef.current) return resolve(null);
      const el = document.querySelector(`[data-tour="${selectorId}"]`);
      if (el) return resolve(el);
      if (performance.now() - start > TARGET_TIMEOUT_MS) return resolve(null);
      setTimeout(poll, TARGET_POLL_MS);
    })();
  });
}

/** Viewport-relative rect. The overlay is fixed, so no scroll offset is added. */
function rectOf(el) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// ── Spotlight overlay ──────────────────────────────────────────────
function Spotlight({ target }) {
  if (!target) return <div className="tour-backdrop" aria-hidden="true" />;
  const { top, left, width, height } = target;
  return (
    <>
      <div className="tour-backdrop" aria-hidden="true" />
      <div
        className="tour-spotlight-ring"
        style={{
          position: 'fixed',
          top:    top    - SPOT_PADDING,
          left:   left   - SPOT_PADDING,
          width:  width  + SPOT_PADDING * 2,
          height: height + SPOT_PADDING * 2,
        }}
        aria-hidden="true"
      />
    </>
  );
}

/**
 * Place the card beside the target, flipping to the opposite side when the
 * preferred side would push it off-screen.
 */
function computeCardStyle(target, cardHeight) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const h  = cardHeight || FALLBACK_CARD_HEIGHT;

  if (!target) {
    return { top: Math.max(PAD, (vh - h) / 2), left: Math.max(PAD, (vw - CARD_WIDTH) / 2) };
  }

  const { top, left, height } = target;
  const below = top + height + SPOT_PADDING + PAD;
  const above = top - SPOT_PADDING - PAD - h;

  // Prefer below; flip above when there is no room and above has more.
  let cardTop = below;
  if (below + h > vh - PAD && above > PAD) cardTop = above;

  let cardLeft = left;
  // If the target is wide, keep the card near its left edge; clamp both axes.
  cardLeft = Math.max(PAD, Math.min(cardLeft, vw - CARD_WIDTH - PAD));
  cardTop  = Math.max(PAD, Math.min(cardTop,  vh - h - PAD));

  return { top: cardTop, left: cardLeft };
}

// ── Step dot indicator ─────────────────────────────────────────────
function StepDots({ total, current, onJump }) {
  return (
    <div className="tour-dots" role="tablist" aria-label="Tour progress">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          role="tab"
          type="button"
          aria-selected={i === current}
          aria-label={`Go to step ${i + 1}`}
          onClick={() => onJump(i)}
          className={`tour-dot ${i === current ? 'tour-dot--active' : i < current ? 'tour-dot--done' : ''}`}
        />
      ))}
    </div>
  );
}

/**
 * One step. Mounted with a key of the step index, so advancing the tour
 * remounts this component and every piece of per-step state starts clean —
 * no resetting four useStates inside an effect on each transition.
 */
function TourStep({ step, stepIndex, total, isLast, stopTour, nextStep, prevStep, goToStep, switchTab }) {
  const [target,     setTarget]     = useState(null);
  const [missing,    setMissing]    = useState(false);
  const [cardStyle,  setCardStyle]  = useState({});
  const [visible,    setVisible]    = useState(false);

  const cardRef      = useRef(null);
  const cancelledRef = useRef(false);
  // Mirrors `target` so the ResizeObserver callback can read the current rect
  // without the observer being torn down and rebuilt every time it moves.
  const targetRef    = useRef(null);

  const applyTarget = useCallback((rect) => {
    targetRef.current = rect;
    setTarget(rect);
  }, []);

  // ── Switch tab, wait for the target, measure it ─────────────────
  useEffect(() => {
    cancelledRef.current = false;
    switchTab(step.tab);

    waitForTarget(step.selector, cancelledRef).then(el => {
      if (cancelledRef.current) return;
      if (!el) { setMissing(true); setVisible(true); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Let the smooth scroll settle before measuring, or the ring lands
      // where the element used to be.
      setTimeout(() => {
        if (cancelledRef.current) return;
        applyTarget(rectOf(el));
        setVisible(true);
      }, 260);
    });

    return () => { cancelledRef.current = true; };
  }, [step.selector, step.tab, switchTab, applyTarget]);

  // ── Position the card against its real measured height ──────────
  //
  // A ResizeObserver rather than a layout effect: the card's height depends on
  // how much copy the step carries, and the observer fires once on observe and
  // again whenever that changes. Measuring in an effect body would mean
  // positioning from a stale or guessed height on the first paint.
  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!visible || !node) return;

    const ro = new ResizeObserver(() => {
      setCardStyle(computeCardStyle(targetRef.current, node.offsetHeight));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [visible, target]);

  // ── Keep the spotlight glued to the target ──────────────────────
  useEffect(() => {
    if (!visible || missing) return;
    function reposition() {
      const el = document.querySelector(`[data-tour="${step.selector}"]`);
      if (!el) return;
      const r = rectOf(el);
      applyTarget(r);
      setCardStyle(computeCardStyle(r, cardRef.current?.offsetHeight));
    }
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [visible, missing, step.selector, applyTarget]);

  // ── Keyboard navigation ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')     { e.preventDefault(); stopTour(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextStep(total); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prevStep(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stopTour, nextStep, prevStep, total]);

  // Move focus to the card so screen readers announce each step and the
  // arrow keys work without the user clicking first.
  useEffect(() => {
    if (visible) cardRef.current?.focus?.();
  }, [visible]);

  return (
    <>
      <Spotlight target={missing ? null : target} />

      <div
        ref={cardRef}
        tabIndex={-1}
        className={`tour-card ${visible ? 'tour-card--visible' : ''}`}
        style={{ ...cardStyle, position: 'fixed', zIndex: 9999, width: CARD_WIDTH }}
        role="dialog"
        aria-modal="false"
        aria-label={`Tour step ${stepIndex + 1} of ${total}: ${step.title}`}
      >
        <div className="tour-card-header">
          <span className="tour-card-step-label">STEP {stepIndex + 1} OF {total}</span>
          <button onClick={stopTour} className="tour-card-close" aria-label="Close tour">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="tour-card-title">{step.title}</h3>
        <p className="tour-card-desc">{step.body}</p>

        {step.action && (
          <p className="tour-card-action">
            <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{step.action}</span>
          </p>
        )}

        {missing && (
          <p className="tour-card-missing">
            This part of the screen isn&apos;t on view right now — it may still be
            loading, or be hidden for your role. The explanation above still applies.
          </p>
        )}

        <div className="tour-card-footer">
          <StepDots total={total} current={stepIndex} onJump={goToStep} />
          <div className="tour-card-nav">
            {stepIndex > 0 && (
              <button onClick={prevStep} className="tour-btn tour-btn--back" aria-label="Previous step">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {isLast ? (
              <button onClick={stopTour} className="tour-btn tour-btn--done" aria-label="Finish tour" id="tour-done-btn">
                <CheckCircle className="w-3.5 h-3.5" /> Done
              </button>
            ) : (
              <button onClick={() => nextStep(total)} className="tour-btn tour-btn--next" aria-label="Next step" id="tour-next-btn">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main WalkthroughTour component ────────────────────────────────
export default function WalkthroughTour({ userRole, visibleTabIds }) {
  const {
    isActive, stepIndex, stopTour, nextStep, prevStep, goToStep, switchTab,
  } = useWalkthrough();

  const steps = getStepsForRole(userRole, visibleTabIds);
  const total = steps.length;

  if (!isActive || !total) return null;

  // Clamp: the visible-tab filter can shorten a tour between renders.
  const index = Math.min(stepIndex, total - 1);
  const step  = steps[index];
  if (!step) return null;

  return (
    <TourStep
      key={index}
      step={step}
      stepIndex={index}
      total={total}
      isLast={index === total - 1}
      stopTour={stopTour}
      nextStep={nextStep}
      prevStep={prevStep}
      goToStep={goToStep}
      switchTab={switchTab}
    />
  );
}
