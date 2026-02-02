import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './contexts/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Production Hardening: Remove console logs
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

// Validation: Ensure critical env vars exist
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingEnvs = requiredEnvVars.filter(key => {
  return !((import.meta as any).env?.[key] || process.env?.[key] || (window as any)?._env_?.[key]);
});

if (missingEnvs.length > 0) {
  console.error(`[System] Missing critical environment variables: ${missingEnvs.join(', ')}`);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DataProvider>
        <App />
      </DataProvider>
    </ErrorBoundary>
  </React.StrictMode>
);