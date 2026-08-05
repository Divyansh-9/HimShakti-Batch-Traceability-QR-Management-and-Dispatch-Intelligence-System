// src/components/WelcomeChoiceModal.jsx
// ── "Help & Walkthrough" welcome choice modal ──────────────────────
// Auto-fires for new users; also shown when returning users click ? / sidebar btn.
// Three choices: Take the Tour · Explore Myself · Skip for Now
import React, { useEffect, useRef } from 'react';
import { Compass, Map, X, Sparkles, ArrowRight } from 'lucide-react';
import { useWalkthrough } from '../context/WalkthroughContext';

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

const ROLE_TOUR_COUNTS = {
  'super-admin':          6,
  'admin':                6,
  'manager':              5,
  'factory-manager':      3,
  'quality-inspector':    3,
  'dispatch-coordinator': 3,
};

// Role-specific taglines shown in the modal
const ROLE_TAGLINE = {
  'super-admin':          'Full platform access — users, batches, AI audit, and more.',
  'admin':                'Manage batches, dispatch, QR codes, and user access.',
  'manager':              'Oversee inventory, FEFO queue, and AI insights.',
  'factory-manager':      'Create and track batch records from the factory floor.',
  'quality-inspector':    'Monitor batch status, expiry urgency, and FEFO priority.',
  'dispatch-coordinator': 'Manage dispatch order, FEFO queue, and QR traceability.',
};

export default function WelcomeChoiceModal({ user }) {
  const { startTour, startNudge, skipTour, showWelcome } = useWalkthrough();
  const backdropRef = useRef(null);

  const role      = user?.role || 'admin';
  const name      = user?.name || user?.username || 'there';
  const roleLabel = ROLE_LABELS[role] || role;
  const colors    = ROLE_COLORS[role] || ROLE_COLORS['admin'];
  const steps     = ROLE_TOUR_COUNTS[role] || 4;
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
