import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import TracePage from './pages/TracePage';
import InvitePage from './pages/InvitePage';
import ComponentShowcase from './pages/ComponentShowcase';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/about"     element={<About />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/showcase"  element={<ComponentShowcase />} />

        {/* Public QR trace page — no auth required */}
        <Route path="/trace/:batchCode" element={<TracePage />} />

        {/* Invite page — new user sets their password via invite link */}
        <Route path="/invite" element={<InvitePage />} />


        {/* Protected routes — must be logged in */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
