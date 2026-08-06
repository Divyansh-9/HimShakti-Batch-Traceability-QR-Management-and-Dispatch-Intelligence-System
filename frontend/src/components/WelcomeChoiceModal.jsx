// src/components/WelcomeChoiceModal.jsx
// ── "Help & Walkthrough" welcome choice modal ──────────────────────
// Auto-fires for new users; also shown when returning users click ? / sidebar btn.
// Three choices: Take the Tour · Explore Myself · Skip for Now
import React, { useEffect, useRef } from 'react';
import { Compass, Map, X, Sparkles, ArrowRight } from 'lucide-react';
import { useWalkthrough } from '../context/WalkthroughContext';
import { getStepsForRole } from '../config/walkthroughSteps';

// ── Role display helpers ──────────────────────────────────────────
const ROLE_LABELS = {
  'super-admin':          'Super Admin',
  'admin':                'Admin',
  'manager':              'Manager',
  'factory-manager':      'Factory Manager',
  'quality-inspector':    'Quality Inspector',
  'dispatch-coordinator': 'Dispatch Coordinator',
};

const ROLE_COLORS = {
  'super-admin':          { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25', dot: 'bg-purple-400' },
  'admin':                { bg: 'bg-rose-500/15',   text: 'text-rose-400',   border: 'border-rose-500/25',   dot: 'bg-rose-400' },
  'manager':              { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/25',   dot: 'bg-blue-400' },
  'factory-manager':      { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/25',  dot: 'bg-amber-400' },
  'quality-inspector':    { bg: 'bg-teal-500/15',   text: 'text-teal-400',   border: 'border-teal-500/25',   dot: 'bg-teal-400' },
  'dispatch-coordinator': { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/25',  dot: 'bg-green-400' },
};

// The step count is read from the tour definition itself rather than kept in a
// second table here — a hardcoded count silently lies the moment a step is
// added or removed.

// Role-specific taglines. Each names what that role actually does in the
// system, including the tab that exists specifically for them.
const ROLE_TAGLINE = {
  'super-admin':          'Everything: batches, dispatch, imports, quality records, AI audit, and who gets access.',
  'admin':                'Batches, dispatch, bulk imports, quality records, and user access.',
  'manager':              'Oversee inventory, the FEFO queue, quality inspections, imports, and AI insights.',
  'factory-manager':      'Log production batches, import a run in bulk, and keep the traceability chain intact.',
  'quality-inspector':    'Submit and review quality inspections — the gate every batch has to pass.',
  'dispatch-coordinator': 'Work the FEFO queue, record dispatches, and label shipments with their trace QR.',
};

export default function WelcomeChoiceModal({ user, visibleTabIds }) {
  const { startTour, startNudge, skipTour, showWelcome } = useWalkthrough();
  const backdropRef = useRef(null);

  const role      = user?.role || 'admin';
  const name      = user?.name || user?.username || 'there';
  const roleLabel = ROLE_LABELS[role] || role;
  const colors    = ROLE_COLORS[role] || ROLE_COLORS['admin'];
  const steps     = getStepsForRole(role, visibleTabIds).length;
  const tagline   = ROLE_TAGLINE[role] || '';

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) skipTour();
  }

  // Keyboard: Escape to skip
  useEffect(() => {
    if (!showWelcome) return;
    function onKey(e) {
      if (e.key === 'Escape') skipTour();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showWelcome, skipTour]);

  if (!showWelcome) return null;

  return (
    <div
      ref={backdropRef}
      className="welcome-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome — choose how to get started"
    >
      <div className="welcome-modal-card">
        {/* ── Close button ── */}
        <button
          onClick={skipTour}
          className="welcome-modal-close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Header ── */}
        <div className="welcome-modal-header">
          {/* Animated icon cluster */}
          <div className="welcome-icon-cluster">
            <div className="welcome-icon-ring" />
            <div className="welcome-icon-inner">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="welcome-modal-title-block">
            <h2 className="welcome-modal-title">
              Welcome, {name}! 👋
            </h2>
            {/* Role badge */}
            <span className={`welcome-role-badge ${colors.bg} ${colors.text} ${colors.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
              {roleLabel}
            </span>
          </div>

          <p className="welcome-modal-tagline">{tagline}</p>
        </div>

        <div className="welcome-modal-divider" />

        {/* ── Choice prompt ── */}
        <p className="welcome-modal-prompt">How would you like to get started?</p>

        {/* ── Choice cards ── */}
        <div className="welcome-choices-grid">
          {/* Choice 1: Take the Tour */}
          <button
            id="welcome-take-tour-btn"
            onClick={startTour}
            className="welcome-choice-card welcome-choice-card--primary"
          >
            <div className="welcome-choice-icon welcome-choice-icon--tour">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="welcome-choice-body">
              <span className="welcome-choice-title">
                Take the Tour
                <span className="welcome-choice-recommended">Recommended</span>
              </span>
              <span className="welcome-choice-desc">
                {steps}-step guided walkthrough tailored to your role
              </span>
            </div>
            <ArrowRight className="w-4 h-4 welcome-choice-arrow" />
          </button>

          {/* Choice 2: Explore Myself */}
          <button
            id="welcome-explore-btn"
            onClick={startNudge}
            className="welcome-choice-card welcome-choice-card--secondary"
          >
            <div className="welcome-choice-icon welcome-choice-icon--explore">
              <Map className="w-5 h-5" />
            </div>
            <div className="welcome-choice-body">
              <span className="welcome-choice-title">Explore Myself</span>
              <span className="welcome-choice-desc">
                I'll highlight your starting point — the rest is yours
              </span>
            </div>
            <ArrowRight className="w-4 h-4 welcome-choice-arrow" />
          </button>
        </div>

        {/* ── Skip link ── */}
        <div className="welcome-modal-footer">
          <button
            id="welcome-skip-btn"
            onClick={skipTour}
            className="welcome-skip-btn"
          >
            Skip for now — I'll figure it out
          </button>
          <p className="welcome-footer-hint">
            You can always re-launch the tour from the sidebar or the <strong>?</strong> button.
          </p>
        </div>
      </div>
    </div>
  );
}
