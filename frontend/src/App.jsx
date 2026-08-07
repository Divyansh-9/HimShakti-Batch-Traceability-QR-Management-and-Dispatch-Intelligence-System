import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import TracePage from './pages/TracePage';
import InvitePage from './pages/InvitePage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Split off the two heaviest routes.
 *
 * Dashboard alone is ~3,400 lines carrying every tab plus the admin
 * panel, and it was bundled into the single chunk every visitor
 * downloads — including the consumer who scanned a QR code on a jar and
 * wants four lines of provenance, quite possibly on a village 3G
 * connection. They now get the trace page without the factory
 * application attached to it.
 *
 * ComponentShowcase is a developer page no end user ever opens.
 */
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase'));

/** Shown only while a split chunk is in flight — usually imperceptible. */
function RouteFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div
        aria-label="Loading"
        role="status"
        style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid var(--brand-primary, #1a4731)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}


function App() {
  return (
    <>
      {/* Keyboard users land here first; it stays invisible until focused.
          Without it, tabbing into any page means walking the whole nav. */}
      <a href="#main-content" className="skip-to-content">Skip to main content</a>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/about"     element={<About />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/showcase"  element={<ComponentShowcase />} />

        {/* Public QR trace pages — no auth required.
            /trace/t/:token  → scanned QR, full provenance record
            /trace/:batchCode → legacy label or hand-typed code, reduced record
            The token route is declared first so "t" is never matched as a batch code. */}
        <Route path="/trace/t/:token"   element={<TracePage />} />
        <Route path="/trace/:batchCode" element={<TracePage />} />

        {/* Invite page — new user sets their password via invite link */}
        <Route path="/invite" element={<InvitePage />} />


        {/* Protected routes — must be logged in */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all — an unmatched URL used to render a blank page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
