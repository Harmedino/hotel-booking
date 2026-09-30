import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Vendor libraries change rarely, so keep them in their own long-cached chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('motion')) return 'motion';
          if (id.includes('redux') || id.includes('reselect') || id.includes('immer')) return 'redux';
          if (id.includes('lucide')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
})
