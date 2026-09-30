import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }

  // A production build without VITE_API_URL would quietly call localhost from
  // users' browsers. Fail the build (e.g. on Vercel) with a clear message instead.
  if (command === 'build' && mode === 'production') {
    const apiUrl = env.VITE_API_URL?.trim()
    if (!apiUrl) {
      throw new Error(
        'VITE_API_URL is not set. Add it in Vercel → Project → Settings → Environment Variables ' +
          '(e.g. https://your-api.onrender.com), then redeploy.'
      )
    }
    if (!/^https?:\/\/\S+$/.test(apiUrl)) {
      throw new Error(`VITE_API_URL must be a full URL like https://your-api.onrender.com (got "${apiUrl}").`)
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Vendor libraries change rarely, so keep them in their own long-cached chunks.
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('motion')) return 'motion'
            if (id.includes('redux') || id.includes('reselect') || id.includes('immer')) return 'redux'
            if (id.includes('lucide')) return 'icons'
            return 'vendor'
          },
        },
      },
    },
  }
})
