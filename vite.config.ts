
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Correctly handle API_KEY injection. Fallback to empty string to avoid build-time 'undefined' crashes
    // while ensuring the @google/genai client can still be initialized.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'process.env.PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.PAYSTACK_PUBLIC_KEY || '')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          supabase: ['@supabase/supabase-js']
          // 'ai' chunk removed as per request to simplify bundle or handle ESM resolution differently
        }
      }
    }
  }
});
