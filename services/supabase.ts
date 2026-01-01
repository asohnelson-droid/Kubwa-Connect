
import { createClient } from '@supabase/supabase-js';

/**
 * Robust Environment Variable Loader
 */
const getEnvValue = (key: string, fallback: string): string => {
  // Vite's standard way to access env variables
  const value = (import.meta as any).env?.[key] || (process as any).env?.[key];
  
  if (!value || value === 'undefined' || value === 'null' || value === '') {
    return fallback.trim();
  }
  
  // Clean potential quotes from string
  let cleanVal = value.trim().replace(/^["']|["']$/g, '');
  
  // Enforce HTTPS for Supabase URLs
  if (key.includes('URL') && cleanVal.startsWith('http://')) {
    cleanVal = cleanVal.replace('http://', 'https://');
  }
  
  return cleanVal;
};

const FALLBACK_URL = 'https://espbxsheydqoaeechgln.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGJ4c2hleWRxb2FlZWNoZ2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjIxNDAsImV4cCI6MjA4MDMzODE0MH0.GHEHlPgrdeBXWsVMuIC4kM4lJFC4xjDmGjMwU9RWznw';

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseKey = getEnvValue('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

/**
 * FAULT-TOLERANT STORAGE HANDLER
 * Ensures auth tokens are saved even when localStorage is near its limit.
 */
const customStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("[Supabase] Storage quota exceeded. Purging cache to prioritize auth session.");
        // Emergency cleanup: Clear non-essential data to make room for auth tokens
        localStorage.removeItem('kubwa_cart');
        localStorage.removeItem('kubwa_onboarding_seen');
        try {
          localStorage.setItem(key, value);
        } catch {
          // Final fallback: clear everything if absolutely necessary
          localStorage.clear();
          localStorage.setItem(key, value);
        }
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

/**
 * CLIENT SINGLETON
 * persistSession: true keeps the user logged in across refreshes.
 * autoRefreshToken: true handles token lifecycle automatically.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'kubwa-connect-auth'
  }
});

/**
 * HEALTH CHECK UTILITY
 */
export const testSupabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Supabase connection is healthy.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Unknown connection error' };
  }
};
