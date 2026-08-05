// src/context/WalkthroughContext.jsx
// ── Global Help & Walkthrough state ────────────────────────────────
// Exposes: startTour, stopTour, isActive, showWelcome, setShowWelcome
// New-user detection: checks localStorage key  hs_tour_seen_{role}
// If missing → WelcomeChoiceModal auto-fires after 1.2 s on dashboard mount
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WalkthroughContext = createContext(null);

export function WalkthroughProvider({ children, userRole, isNewUser }) {
  // Whether the guided tour is currently running
  const [isActive,      setIsActive]      = useState(false);
  // Which step index we're on (0-based)
  const [stepIndex,     setStepIndex]     = useState(0);
  // Whether the welcome-choice modal is visible
  const [showWelcome,   setShowWelcome]   = useState(false);
  // "explore" nudge mode — pulse a single element instead of full tour
  const [nudgeMode,     setNudgeMode]     = useState(false);
  // Callback wired by Dashboard to switch tabs during tour
  const tabSwitcherRef = useRef(null);

  // ── Storage helpers ────────────────────────────────────────────
  const storageKey = `hs_tour_seen_${userRole || 'unknown'}`;

  function markSeen() {
    try { localStorage.setItem(storageKey, '1'); } catch { /* no-op */ }
  }

  function hasSeen() {
    try { return !!localStorage.getItem(storageKey); } catch { return false; }
  }

  // ── Auto-fire for genuinely new users ─────────────────────────
  useEffect(() => {
    if (!userRole) return;
    if (hasSeen()) return;          // returning user — never auto-fire
    const tid = setTimeout(() => {
      setShowWelcome(true);
    }, 1200);
    return () => clearTimeout(tid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  // ── Register the tab-switcher callback from Dashboard ─────────
  function registerTabSwitcher(fn) {
    tabSwitcherRef.current = fn;
  }

  // ── Public API ─────────────────────────────────────────────────
  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
    setShowWelcome(false);
    markSeen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
    markSeen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const nextStep = useCallback((totalSteps) => {
    setStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // "Explore Myself" — close modal, trigger brief nudge pulse on key element
  const startNudge = useCallback(() => {
    setShowWelcome(false);
    setNudgeMode(true);
    markSeen();
    setTimeout(() => setNudgeMode(false), 3500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // "Skip for now" — close modal and mark seen so it won't auto-fire again
  const skipTour = useCallback(() => {
    setShowWelcome(false);
    markSeen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Manual trigger — always shows the welcome choice (for both new and returning)
  const openHelp = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
    setShowWelcome(true);
  }, []);

  function switchTab(tabId) {
    tabSwitcherRef.current?.(tabId);
  }

  return (
    <WalkthroughContext.Provider value={{
      isActive, stepIndex, showWelcome, nudgeMode,
      startTour, stopTour, nextStep, prevStep, skipTour, startNudge, openHelp,
      registerTabSwitcher, switchTab,
    }}>
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) throw new Error('useWalkthrough must be used inside WalkthroughProvider');
  return ctx;
}
