import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { emulateColorScheme } from './src/tests/helpers/browser-commands.js'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'src/tests/node/**/*.spec.ts',
            'src/tests/shared/**/*.spec.ts',
          ],
        },
      },
      {
        test: {
          name: 'chromium',
          include: [
            'src/tests/browser/**/*.spec.ts',
            'src/tests/shared/**/*.spec.ts',
          ],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            commands: {
              emulateColorScheme,
            },
          },
        },
      },
      // {
      //   test: {
      //     name: 'firefox',
      //     include: [
      //       'src/tests/browser/**/*.spec.ts',
      //       'src/tests/shared/**/*.spec.ts',
      //     ],
      //     browser: {
      //       enabled: true,
      //       provider: playwright(),
      //       headless: true,
      //       instances: [{ browser: 'firefox' }],
      //       commands: {
      //         emulateColorScheme,
      //       },
      //     },
      //   },
      // },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
})
