// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

// Decode a JWT payload without a library (base64 decode the middle segment)
function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token || !isTokenValid(token)) {
    // Clear any stale / expired token so next login starts fresh
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  return children;
}
