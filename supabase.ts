
import { createClient } from '@supabase/supabase-js';

/**
 * KUBWA CONNECT - SUPABASE CLIENT CONFIGURATION
 */

const FALLBACK_URL = 'https://espbxsheydqoaeechgln.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGJ4c2hleWRxb2FlZWNoZ2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjIxNDAsImV4cCI6MjA4MDMzODE0MH0.GHEHlPgrdeBXWsVMuIC4kM4lJFC4xjDmGjMwU9RWznw';

const getCleanEnv = (key: string, fallback: string): string => {
  try {
    const val = 
      (import.meta as any).env?.[key] || 
      (process as any).env?.[key] || 
      (window as any)?._env_?.[key];
      
    if (!val || val === 'undefined' || val === 'null' || val === '') {
      return fallback.trim();
    }
    return val.trim().replace(/^["'](.+)["']$/, '$1');
  } catch (e) {
    return fallback.trim();
  }
};

const supabaseUrl = getCleanEnv('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseKey = getCleanEnv('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

/**
 * GLOBAL CLEANUP
 * Removes known bloated keys from previous sessions to free up quota.
 */
const performStoragePurge = () => {
  try {
    const oversizedKeys = ['user_profiles', 'product_lists', 'product_cache', 'search_history_bloat'];
    oversizedKeys.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
};

/**
 * ULTRA-MINIMAL STORAGE ENGINE
 * Only stores the absolute essentials for Auth to prevent QuotaExceededError.
 */
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      let finalValue = value;
      
      // If this is the auth session, strip ALL metadata except identifiers
      if (key.includes('auth-storage')) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.session && parsed.session.user) {
            const user = parsed.session.user;
            
            // Reconstruct a tiny user object
            parsed.session.user = {
              id: user.id,
              email: user.email,
              aud: user.aud,
              role: user.role,
              user_metadata: {
                role: user.user_metadata?.role,
                tier: user.user_metadata?.tier,
                isSetupComplete: user.user_metadata?.isSetupComplete
              }
            };
            
            // Strip the user object from the session root if it's duplicated
            finalValue = JSON.stringify(parsed);
          }
        } catch (parseErr) {}
      }
      
      localStorage.setItem(key, finalValue);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        performStoragePurge();
        // If still failing, drop the cart to save the session
        localStorage.removeItem('kubwa_cart');
        try {
          localStorage.setItem(key, value);
        } catch (retryErr) {}
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'kubwa-auth-storage',
    storage: safeStorage,
  }
});

// Added missing diagnostic function to check Supabase connectivity for AuthModal
export const testSupabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Supabase connection is healthy.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Unknown connection error' };
  }
};

// Run once on load
performStoragePurge();
