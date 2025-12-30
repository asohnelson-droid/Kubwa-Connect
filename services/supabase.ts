import { createClient } from '@supabase/supabase-js';

/**
 * PRODUCTION SUPABASE CONFIGURATION
 * We force HTTPS and provide a fallback to ensure the app remains functional
 * even if environment variables are partially missing during build/deploy.
 */
const getSanitizedUrl = () => {
  const rawUrl = process.env.VITE_SUPABASE_URL || '';
  const fallbackUrl = 'https://bzuwzvrmwketoyumiawi.supabase.co';
  
  // Handle empty, undefined, or malformed strings from environment injection
  let url = (rawUrl && rawUrl !== 'undefined' && rawUrl !== '') ? rawUrl : fallbackUrl;

  // Security: Force HTTPS
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  } else if (!url.startsWith('https://')) {
    url = fallbackUrl; // Revert to known-good secure fallback if protocol is missing
  }

  // CRITICAL FIX: Remove trailing slashes which cause "Failed to fetch" in many environments
  return url.replace(/\/$/, "");
};

const supabaseUrl = getSanitizedUrl();
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dXd6dnJtd2tldG95dW1pYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODQ3NDcsImV4cCI6MjA4MTM2MDc0N30.tcAtrMriTi91S8ngX8lE2WbpQHDrB0htn9MFqf9PbSs';

const isBrowser = typeof window !== 'undefined';

const safeStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e: any) {
      // Handle private browsing or full storage gracefully
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.warn("Storage quota exceeded. Purging non-essential data...");
        Object.keys(window.localStorage).forEach(k => {
          if (!k.includes('auth-token')) {
            window.localStorage.removeItem(k);
          }
        });
      }
    }
  },

  removeItem: (key: string) => {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});