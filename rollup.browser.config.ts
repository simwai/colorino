import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default defineConfig([
  // ESM bundle for modern browsers / unpkg ESM
  {
    input: 'dist/browser.mjs',
    output: {
      file: 'dist/browser.bundle.mjs',
      format: 'esm',
      inlineDynamicImports: true,
    },
    plugins: [resolve({ browser: true, preferBuiltins: false }), commonjs()],
    treeshake: true,
  },

  // CJS bundle variant
  {
    input: 'dist/browser.mjs',
    output: {
      file: 'dist/browser.bundle.cjs',
      format: 'cjs',
      inlineDynamicImports: true,
    },
    plugins: [resolve({ browser: true, preferBuiltins: false }), commonjs()],
    treeshake: true,
  },
])
