import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const cspHeader = [
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
  "script-src-elem 'self' 'unsafe-inline' https://js.stripe.com",
  "connect-src 'self' ws://localhost:3000 ws://localhost:4000 http://localhost:4000 https://api.cloudinary.com https://api.stripe.com",
  "object-src 'none'"
].join('; ')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
