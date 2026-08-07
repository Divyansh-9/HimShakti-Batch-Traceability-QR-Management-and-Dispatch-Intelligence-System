import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import TracePage from './pages/TracePage';
import InvitePage from './pages/InvitePage';
import ComponentShowcase from './pages/ComponentShowcase';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <>
      {/* Keyboard users land here first; it stays invisible until focused.
          Without it, tabbing into any page means walking the whole nav. */}
      <a href="#main-content" className="skip-to-content">Skip to main content</a>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
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
    </>
  );
}

export default App;
