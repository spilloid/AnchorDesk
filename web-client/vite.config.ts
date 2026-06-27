import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

// Bake the package version into the bundle so the UI can show which build is
// running (answers "did the deploy land?" at a glance — see AccountMenu).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    host: true,   // bind 0.0.0.0 — required for Docker / k8s
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8060/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Probe self-service + MCP keep their paths (backend serves them at root).
      '/probe': { target: 'http://backend:8060/', changeOrigin: true },
      '/mcp': { target: 'http://backend:8060/', changeOrigin: true },
      // WebSocket live-update channel — the /api prefix is stripped to /ws.
      '/api/ws': {
        target: 'ws://backend:8060/',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    }
  },
  plugins: [react()],
})
