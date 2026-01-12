import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import terser from '@rollup/plugin-terser'

const terserOptions = {
  ecma: 2017,
  module: false,
  toplevel: false,
  keep_classnames: false,
  keep_fnames: false,
  safari10: false,
  format: {
    comments: false,
  },
  compress: {
    passes: 2,
  },
  mangle: true,
  sourceMap: true,
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
    hooks: {
      'build:done'() {
        // Copy osc-child-probe.js to dist
        mkdirSync('dist', { recursive: true })
        copyFileSync(
          join('src', 'osc-child-probe.js'),
          join('dist', 'osc-child-probe.js')
        )
        console.log('✓ Copied osc-child-probe.js to dist/')
      },
    },
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

  // --- 3a. CDN: ESM Regular ---
  {
    name: 'cdn-esm',
    entries: ['src/browser'],
    declaration: false,
    sourcemap: true,
    rollup: {
      inlineDependencies: true,
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
        ]
      },
    },
    failOnWarn: false,
  },

  // --- 3b. CDN: ESM Minified ---
  {
    name: 'cdn-esm-min',
    entries: ['src/browser'],
    declaration: false,
    sourcemap: false,
    rollup: {
      inlineDependencies: true,
    },
    hooks: {
      'rollup:options'(_ctx, options) {
        options.external = id => id.startsWith('node:')
        options.input = 'src/browser.ts'
        options.output = [
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

  // --- 4a. CDN: UMD Regular ---
  {
    name: 'cdn-umd',
    entries: ['src/browser-umd.ts'],
    declaration: false,
    sourcemap: true,
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
        ]
      },
    },
    failOnWarn: false,
  },

  // --- 4b. CDN: UMD Minified ---
  {
    name: 'cdn-umd-min',
    entries: ['src/browser-umd.ts'],
    declaration: false,
    sourcemap: false,
    rollup: {
      inlineDependencies: true,
    },
    hooks: {
      'rollup:options'(_ctx, options) {
        options.external = id => id.startsWith('node:')
        options.input = 'src/browser-umd.ts'
        options.output = [
          {
            file: 'dist/cdn.min.js',
            format: 'umd',
            name: 'colorino',
            exports: 'default',
            sourcemap: false,
            // @ts-ignore
            plugins: [terser(terserOptions)],
          },
        ]
      },
    },
    failOnWarn: false,
  },
])
