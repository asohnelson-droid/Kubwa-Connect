import { createClient } from '@supabase/supabase-js';

/**
 * KUBWA CONNECT - SUPABASE CLIENT CONFIGURATION
 * 
 * Refined for maximum compatibility across different browser environments.
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

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'kubwa-auth-storage',
  }
});

/**
 * Diagnostic helper to verify if the Supabase project is reachable.
 * Useful for debugging 'Failed to fetch' errors which are usually network-level.
 */
export const testSupabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    // Attempt a simple health check or root fetch
    const startTime = Date.now();
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey }
    });
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      return { ok: true, message: `Connected successfully (${duration}ms)` };
    } else {
      return { ok: false, message: `Server responded with status: ${response.status}` };
    }
  } catch (err: any) {
    return { ok: false, message: err.message || "Network connection blocked" };
  }
};
