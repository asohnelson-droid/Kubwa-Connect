
import { createClient } from '@supabase/supabase-js';

/**
 * KUBWA CONNECT - SUPABASE CLIENT CONFIGURATION
 * Optimized for production persistence and Netlify/Vite environment variable standards.
 */

const getEnv = (key: string): string => {
  // Fix: Property 'env' does not exist on type 'ImportMeta' - using type assertion to access Vite's meta property
  const meta = import.meta as any;
  return (meta.env && meta.env[key]) || (typeof process !== 'undefined' ? (process.env as any)[key] : '') || '';
};

const getSanitizedUrl = () => {
  const url = getEnv('VITE_SUPABASE_URL') || 'https://bzuwzvrmwketoyumiawi.supabase.co';
  // Ensure no trailing slash and force https
  return url.replace(/\/$/, "").replace('http://', 'https://');
};

const supabaseUrl = getSanitizedUrl();
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dXd6dnJtd2tldG95dW1pYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODQ3NDcsImV4cCI6MjA4MTM2MDc0N30.tcAtrMriTi91S8ngX8lE2WbpQHDrB0htn9MFqf9PbSs';

// Check if we are in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Standard Supabase Client
 * persistSession: true ensures the auth token is saved to localStorage.
 * autoRefreshToken: true handles silent token renewal.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kubwaconnect-auth-token', // Explicitly named to avoid collisions
    storage: isBrowser ? window.localStorage : undefined,
    flowType: 'pkce'
  }
});
