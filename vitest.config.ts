import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only run Node tests, skip browser
    exclude: [
      'node_modules/',
      'dist/',
      'src/tests/browser/**/*.spec.ts', // Skip browser tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.*'],
    },
  },
})
