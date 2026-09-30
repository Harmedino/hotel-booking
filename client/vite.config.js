import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }

  // Without VITE_API_URL the deployed app would call localhost from users'
  // browsers. Warn loudly in the build log, but never fail the deployment.
  if (command === 'build' && mode === 'production') {
    const apiUrl = env.VITE_API_URL?.trim()
    if (!apiUrl || !/^https?:\/\/\S+$/.test(apiUrl)) {
      console.warn(
        `\n⚠ VITE_API_URL is ${apiUrl ? `invalid ("${apiUrl}")` : 'not set'}. The app will call http://localhost:4000.\n` +
          '  Set it in Vercel → Project → Settings → Environment Variables (e.g. https://your-api.onrender.com), then redeploy.\n'
      )
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
