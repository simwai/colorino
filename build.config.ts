import { defineBuildConfig } from 'unbuild'
import terser from '@rollup/plugin-terser'

const terserOptions = {
  ecma: 2017, // fine for modern Node and browsers you target
  module: false, // UMD is not an ES module
  toplevel: false, // keep global names like `colorino` intact
  keep_classnames: false,
  keep_fnames: false,
  safari10: false,
  format: {
    comments: false, // strip comments in CDN builds
  },
  compress: {
    passes: 2, // small extra squeeze, still safe
  },
  mangle: true, // allowed because UMD wrapper handles exports
  sourceMap: true, // let Rollup wire filename/url for you
}

export default defineBuildConfig([
  // --- 1. Node.js Build (Lean) ---
  {
    name: 'node',
    entries: [{ input: 'src/node', name: 'node' }],
    rollup: {
      emitCJS: true,
      inlineDependencies: false,
    },
    declaration: true,
    failOnWarn: false,
  },

  // --- 2. Browser Library Build (Lean, Tree-shakeable) ---
  {
    name: 'browser-lib',
    entries: [{ input: 'src/browser', name: 'browser' }],
    rollup: {
      emitCJS: false,
      inlineDependencies: false,
    },
    declaration: true,
    failOnWarn: false,
  },

  // --- 3. CDN: ESM Builds (Fat, Bundled) ---
  // Generates: dist/cdn.mjs (Debug) & dist/cdn.min.mjs (Prod)
  {
    name: 'cdn-esm',
    entries: ['src/browser'],
    declaration: false,
    rollup: {
      inlineDependencies: true, // Bundle everything
    },
    hooks: {
      'rollup:options'(_ctx, options) {
        options.external = id => id.startsWith('node:')
        options.input = 'src/browser.ts'
        options.output = [
          {
            file: 'dist/cdn.mjs',
            format: 'esm',
            sourcemap: true,
          },
          {
            file: 'dist/cdn.min.mjs',
            format: 'esm',
            sourcemap: false,
            // @ts-ignore
            plugins: [terser(terserOptions)],
          },
        ]
      },
    },
    failOnWarn: false,
  },

  // --- 4. CDN: UMD Builds (Fat, Bundled) ---
  // Generates: dist/cdn.js (Debug) & dist/cdn.min.js (Prod)
  {
    name: 'cdn-umd',
    entries: ['src/browser-umd.ts'],
    declaration: false,
    rollup: {
      inlineDependencies: true,
    },
    hooks: {
      'rollup:options'(_ctx, options) {
        options.external = id => id.startsWith('node:')
        options.input = 'src/browser-umd.ts'
        options.output = [
          {
            file: 'dist/cdn.js',
            format: 'umd',
            name: 'colorino',
            exports: 'default',
            sourcemap: true,
          },
          {
            file: 'dist/cdn.min.js',
            format: 'umd',
            name: 'colorino',
            exports: 'default',
            sourcemap: true,
            // @ts-ignore
            plugins: [terser(terserOptions)],
          },
        ]
      },
    },
    failOnWarn: false,
  },
])
