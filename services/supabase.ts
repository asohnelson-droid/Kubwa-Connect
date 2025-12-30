
import { createClient } from '@supabase/supabase-js';

/**
 * KUBWA CONNECT - SUPABASE CLIENT CONFIGURATION
 * Optimized for production persistence and Netlify/Vite environment variable standards.
 * 
 * POLICY: Only Supabase manages auth tokens. No manual localStorage caching allowed.
 */

const getEnv = (key: string): string => {
  const meta = import.meta as any;
  const value = (meta.env && meta.env[key]) || (typeof process !== 'undefined' ? (process.env as any)[key] : '');
  
  if (!value || value === 'undefined' || value === 'null' || value === '') {
    return '';
  }
  return value;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://bzuwzvrmwketoyumiawi.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dXd6dnJtd2tldG95dW1pYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODQ3NDcsImV4cCI6MjA4MTM2MDc0N30.tcAtrMriTi91S8ngX8lE2WbpQHDrB0htn9MFqf9PbSs';

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Let Supabase handle the token
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kubwaconnect-auth-token', // Unique key for Supabase persistence
    storage: isBrowser ? window.localStorage : undefined,
    flowType: 'pkce'
  }
});
