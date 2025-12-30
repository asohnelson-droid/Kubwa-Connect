
import { createClient } from '@supabase/supabase-js';

/**
 * KUBWA CONNECT - SUPABASE CLIENT CONFIGURATION
 * Optimized for production persistence and Netlify/Vite environment variable standards.
 */

const getEnv = (key: string): string => {
  const meta = import.meta as any;
  const value = (meta.env && meta.env[key]) || (typeof process !== 'undefined' ? (process.env as any)[key] : '');
  
  // Clean up common injection artifacts
  if (!value || value === 'undefined' || value === 'null' || value === '') {
    return '';
  }
  return value;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://bzuwzvrmwketoyumiawi.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dXd6dnJtd2tldG95dW1pYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODQ3NDcsImV4cCI6MjA4MTM2MDc0N30.tcAtrMriTi91S8ngX8lE2WbpQHDrB0htn9MFqf9PbSs';

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
}

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
    storageKey: 'kubwaconnect-auth-token',
    storage: isBrowser ? window.localStorage : undefined,
    flowType: 'pkce'
  }
});
