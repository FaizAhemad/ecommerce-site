import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
  const publicSiteUrl = process.env.SITE_URL ?? process.env.VITE_SITE_URL
  return {
    plugins: [react(), tailwindcss()],
    // Expose only this public value; other SITE_* environment values stay private.
    ...(publicSiteUrl === undefined
      ? {}
      : { define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(publicSiteUrl) } }),
    server: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
    },
  }
})
