
import { createClient } from '@supabase/supabase-js';

/**
 * Robust Environment Variable Loader
 */
const getEnvValue = (key: string, fallback: string): string => {
  const value = (import.meta as any).env?.[key] || (process as any).env?.[key];
  
  if (!value || value === 'undefined' || value === 'null' || value === '') {
    return fallback.trim();
  }
  
  let cleanVal = value.trim().replace(/^["']|["']$/g, '');
  
  if (key.includes('URL') && cleanVal.startsWith('http://')) {
    cleanVal = cleanVal.replace('http://', 'https://');
  }
  
  return cleanVal;
};

const FALLBACK_URL = 'https://espbxsheydqoaeechgln.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGJ4c2hleWRxb2FlZWNoZ2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjIxNDAsImV4cCI6MjA4MDMzODE0MH0.GHEHlPgrdeBXWsVMuIC4kM4lJFC4xjDmGjMwU9RWznw';

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseKey = getEnvValue('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

const STORAGE_KEY = 'kubwa-connect-auth';

/**
 * SESSION MINIMIZER
 * Aggressively strips non-essential metadata from the auth session before it hits localStorage.
 * This prevents QuotaExceededError by keeping the auth entry lean.
 * Full user details are retrieved from the 'profiles' table via the API.
 */
const minimizeSession = (value: string): string => {
  try {
    const session = JSON.parse(value);
    if (session && session.user) {
      // Remove bulky metadata that might contain base64 images or long bios
      if (session.user.user_metadata) {
        const { 
          avatar, 
          bio, 
          description, 
          storeName, 
          address, 
          ...essentialMetadata 
        } = session.user.user_metadata;
        session.user.user_metadata = essentialMetadata;
      }
      
      // identities can grow quite large over time
      delete (session.user as any).identities;
      
      // We only strictly need the access_token, refresh_token, and basic user ID/email for re-auth
    }
    return JSON.stringify(session);
  } catch (e) {
    return value;
  }
};

/**
 * FAULT-TOLERANT STORAGE HANDLER
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
    let finalValue = value;
    
    // Minimize auth session specifically
    if (key === STORAGE_KEY) {
      finalValue = minimizeSession(value);
    }

    try {
      localStorage.setItem(key, finalValue);
    } catch (e: any) {
      // Handle QuotaExceededError (code 22)
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("[Supabase] Storage quota reached. Purging non-essential data...");
        
        // Remove cart and onboarding flags to make room for critical auth tokens
        localStorage.removeItem('kubwa_cart');
        localStorage.removeItem('kubwa_onboarding_seen');

        try {
          localStorage.setItem(key, finalValue);
        } catch {
          console.error("[Supabase] Critical Storage Failure: No room even after purge.");
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
 * Configuration strictly follows requirements for Phase 1 stability.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,      // Required: Keeps users logged in across refreshes
    autoRefreshToken: true,    // Required: Smooth transition when tokens expire
    detectSessionInUrl: true,  // Required: For email verification/magic link redirects
    storage: customStorage,
    storageKey: STORAGE_KEY
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
