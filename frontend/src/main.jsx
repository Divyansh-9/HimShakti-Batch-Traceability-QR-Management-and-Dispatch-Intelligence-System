import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 s — background refetch only after stale
      retry: 2,
      refetchOnWindowFocus: false,  // avoids jarring refetch on tab switch
    },
  },
});

// VITE_GOOGLE_CLIENT_ID must be set in frontend/.env for Google Sign-In to work.
// We always render GoogleOAuthProvider (required for useGoogleLogin hook to work),
// using a placeholder when the var is not set — the actual guard is in Login.jsx.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'GOOGLE_NOT_CONFIGURED';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
