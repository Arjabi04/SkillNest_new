import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const cspHeader = [
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
  "script-src-elem 'self' 'unsafe-inline' https://js.stripe.com",
  "object-src 'none'"
].join('; ')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    headers: {
      'Content-Security-Policy': cspHeader
    }
  },
  preview: {
    headers: {
      'Content-Security-Policy': cspHeader
    }
  }
})