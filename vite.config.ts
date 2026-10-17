import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The API has no CORS (same-origin BFF by design, contract §2), so the browser talks to `/api/v1` on this origin and
 * Vite proxies it. CARBON_API_PROXY = where the API runs (default the stack's :8787). VITE_API_URL overrides the base
 * the app calls (default `/api/v1`); point it at another same-origin path or a host that serves CORS.
 */
const target = process.env.CARBON_API_PROXY ?? 'http://127.0.0.1:8787'
const proxy = { '/api': { target, changeOrigin: true } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy, fs: { allow: ['..'] } },
  preview: { port: 4173, proxy },
})
