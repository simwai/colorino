import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Only run browser tests
    include: [
      'src/tests/browser/**/*.spec.ts',
      'src/tests/shared/**/*.spec.ts'
    ],
    exclude: ['node_modules/', 'dist/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
})
