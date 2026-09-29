import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/components/mui/**/*.test.tsx', 'src/router.test.tsx'],
    restoreMocks: true,
    clearMocks: true,
  },
})
