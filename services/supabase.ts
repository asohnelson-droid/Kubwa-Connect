
import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables from Vercel/Netlify, fallback to hardcoded for local preview
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bzuwzvrmwketoyumiawi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dXd6dnJtd2tldG95dW1pYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODQ3NDcsImV4cCI6MjA4MTM2MDc0N30.tcAtrMriTi91S8ngX8lE2WbpQHDrB0htn9MFqf9PbSs';

/**
 * SAFE STORAGE WRAPPER
 * Proactively manages storage limits by pruning heavy metadata from auth tokens 
 * and prioritizing session persistence over non-essential cached data.
 */
const safeStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  
  setItem: (key: string, value: string) => {
    try {
      let dataToStore = value;

      // Detect and prune heavy auth metadata (like base64 avatars) before it hits localStorage
      if (key.includes('-auth-token')) {
        try {
          const sessionData = JSON.parse(value);
          if (sessionData?.user?.user_metadata) {
            // Remove large binary-like strings that bloat the auth token
            const { avatar, bio, products, ...essentialMetadata } = sessionData.user.user_metadata;
            sessionData.user.user_metadata = essentialMetadata;
            dataToStore = JSON.stringify(sessionData);
          }
        } catch (err) {
          // Fallback to original value if parsing fails
        }
      }

      window.localStorage.setItem(key, dataToStore);
    } catch (e: any) {
      // If we still hit a QuotaExceededError, clear non-auth items to make room
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("Storage Quota Exceeded. Purging non-essential data...");
        
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          // Don't remove the auth tokens themselves, remove everything else (cart, onboarding flags, etc.)
          if (k && !k.includes('-auth-token')) {
            keysToRemove.push(k);
          }
        }
        
        keysToRemove.forEach(k => window.localStorage.removeItem(k));

        // Attempt second storage with trimmed data
        try {
          window.localStorage.setItem(key, value);
        } catch (retryErr) {
          console.error("Critical: Storage failed even after purge.");
          // Last resort: clear oldest auth tokens if we really can't save the new one
          Object.keys(window.localStorage).forEach(k => {
             if (k.includes('-auth-token')) window.localStorage.removeItem(k);
          });
        }
      }
    }
  },

  removeItem: (key: string) => {
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
