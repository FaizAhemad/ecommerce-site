import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'force-exit-after-build',
      apply: 'build',
      closeBundle() {
        setTimeout(() => process.exit(0), 0)
      }
    }
  ],
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
  },
})