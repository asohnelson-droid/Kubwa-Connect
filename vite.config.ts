
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Correctly handle API_KEY injection for @google/genai client
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Note: VITE_ prefixed variables are handled natively by Vite in production builds
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
        }
      }
    }
  }
});
