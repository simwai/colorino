# 🎨 Colorino

[![npm](https://img.shields.io/npm/v/colorino?color=8B5CF6&logo=npm&logoColor=white)](https://www.npmjs.com/package/colorino)
[![License](https://img.shields.io/npm/l/colorino?color=8B5CF6)](https://github.com/simwai/colorino/blob/master/LICENSE.MD)
[![npm downloads](https://img.shields.io/npm/dm/colorino?color=8B5CF6&logo=npm&logoColor=white)](https://www.npmjs.com/package/colorino)
[![Vitest](https://img.shields.io/badge/Test-Vitest-8B5CF6?logo=vitest&logoColor=white)](https://vitest.dev/)

Colorino is a `console`-compatible logger for Node.js and the browser that applies ANSI or CSS colors to log output based on the detected environment and theme.

It ships a default instance and a factory (`createColorino`) for custom palettes and options.

![Demo](https://github.com/simwai/colorino/blob/master/screenshots/demo-ps.png?raw=true)
![Demo 2](https://github.com/simwai/colorino/blob/master/screenshots/demo-ps-2.png?raw=true)

---

- [Features](#features)
- [Installation](#installation)
- [Browser via CDN (unpkg)](#browser-via-cdn-unpkg)
  - [ESM (Recommended)](#esm-recommended)
  - [UMD (Classic `<script>`)](#umd-classic-script)
- [Usage](#usage)
  - [Quick Start](#quick-start)
  - [Creating a Custom Logger](#creating-a-custom-logger)
  - [Options & Theme Overrides](#options--theme-overrides)
    - [Available Theme Presets](#available-theme-presets)
    - [Examples](#examples)
  - [Customization](#customization)
  - [Supported Environment Variables](#supported-environment-variables)
  - [Colorize Helper (`colorize(text, hex)`)](#colorize-helper-colorizetext-hex)
  - [Browser-only CSS Helper (`css(text, style)`)](#browser-only-css-helper-csstext-style)
  - [Gradient Text (`gradient(text, startHex, endHex)`)](#gradient-text-gradienttext-starthex-endhex)
- [API Reference](#api-reference)
  - [1. `colorino` (default instance)](#1-colorino-default-instance)
  - [2. `createColorino(palette?, options?)` (factory)](#2-createcolorinopalette-options-factory)
- [Extending Colorino](#extending-colorino)
  - [Use Case: Automatic File/Context Info](#use-case-automatic-filecontext-info)
- [License](#license)

<!-- Table of contents is made with https://github.com/eugene-khyst/md-toc-cli -->

## Features

- Applies ANSI-16, ANSI-256, or Truecolor output in Node.js; CSS `%c` formatting in browser DevTools
- Auto-detects terminal or browser dark/light theme via OSC 11; falls back to a configurable default
- Down-samples hex/RGB palette values to the best color depth supported by the current environment
- Supports all standard log levels: `log`, `info`, `warn`, `error`, `debug`, `trace`
- `createColorino(palette?, options?)` factory for isolated logger instances with custom palettes
- `colorize(text, hex)` helper for per-call color overrides
- `css(text, style)` helper for arbitrary CSS styling in browser DevTools (browser only)
- `gradient(text, startHex, endHex)` for per-character color interpolation (requires ANSI-256 or Truecolor)
- Throws `InputValidationError` at construction time on invalid palette values
- Respects `NO_COLOR`, `FORCE_COLOR`, `CLICOLOR`, `CLICOLOR_FORCE`, and related env vars

## Installation

```bash
npm install colorino
# or
pnpm add colorino
```

## Browser via CDN (unpkg)

### ESM (Recommended)

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { colorino } from 'https://unpkg.com/colorino/dist/cdn.min.mjs'

      colorino.info('Hello from the browser!')
      colorino.error('Something went wrong')
    </script>
  </head>
  <body></body>
</html>
```

Non-minified (for debugging):

```html
<script type="module">
  import { colorino } from 'https://unpkg.com/colorino/dist/cdn.mjs'
</script>
```

### UMD (Classic `<script>`)

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/colorino/dist/cdn.min.js"></script>
    <script>
      colorino.info('Hello from the UMD bundle!')
      colorino.error('Something went wrong')
    </script>
  </head>
  <body></body>
</html>
```

Non-minified:

```html
<script src="https://unpkg.com/colorino/dist/cdn.js"></script>
```

## Usage

### Quick Start

```typescript
import { colorino } from 'colorino'

colorino.error('A critical error!')
colorino.warn('A warning message.')
colorino.info('Useful info logging.')
colorino.log('A plain log.')
colorino.debug('Debug with objects:', { x: 5, y: 9 })
colorino.trace('Tracing app start...')
```

### Creating a Custom Logger

```typescript
import { createColorino } from 'colorino'

const myLogger = createColorino({
  error: '#ff007b',
  info: '#3498db',
})
myLogger.error('Critical!')
myLogger.info('Rebranded info!')
```

### Options & Theme Overrides

`createColorino(palette?, options?)` accepts:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `theme` | `ThemeOption` (see below) | `'auto'` | Control the active color theme or force a specific mode. |
| `maxDepth` | `number` | `5` | Maximum depth when pretty-printing objects in log output. |
| `areNodeFramesVisible` | `boolean` | `true` | Show Node.js internal frames (e.g., `node:internal/...`) in stack traces. |
| `areColorinoFramesVisible` | `boolean` | `false` | Show Colorino internal frames in stack traces (useful for debugging Colorino). |
| `isOsc11Enabled` | `boolean` | `true` | Enables auto light/dark theme detection via OSC 11. Disable if it causes crashes or unwanted behaviour in your terminal. |

**`theme` values:**

- `'auto'` (default) — detects terminal or browser theme and applies the matching preset
- `'dark' | 'light'` — forces the matching default preset regardless of detected theme
- `ThemeName` — forces a specific built-in palette (e.g. `'dracula'`)

#### Available Theme Presets

| Theme Name | Type | Description |
| --- | --- | --- |
| `'dracula'` | Dark (High Contrast) | Pinks, purples, and cyans |
| `'catppuccin-mocha'` | Dark (Low Contrast) | Pastel colors |
| `'github-light'` | Light (High Contrast) | High-contrast |
| `'catppuccin-latte'` | Light (Low Contrast) | Soft warm tones |

In `auto` mode: `dracula` in dark environments, `github-light` in light environments.

#### Examples

**1. Partial palette override on top of auto-detected theme:**

```typescript
const myLogger = createColorino({
  error: '#ff007b',
  warn: '#ffa500',
})

// Dark terminal (dracula base):
// - error: #ff007b
// - warn: #ffa500
// - info: #8be9fd (dracula cyan)
// - log: #f8f8f2 (dracula foreground)
// - debug: #bd93f9 (dracula purple)
// - trace: #6272a4 (dracula comment)

// Light terminal (github-light base):
// - error: #ff007b
// - warn: #ffa500
// - info: #0366d6
// - log: #24292e
// - debug: #586069
// - trace: #6a737d
```

**2. Force a specific preset:**

```typescript
const draculaLogger = createColorino({}, { theme: 'dracula' })
```

**3. Partial palette override on a specific preset:**

```typescript
const myLogger = createColorino({ error: '#ff007b' }, { theme: 'github-light' })
```

**4. Force a theme mode:**

```typescript
const darkLogger = createColorino({}, { theme: 'dark' })
```

> Forcing `'dark'` or `'light'` bypasses OSC 11 detection. Use this in CI pipelines, dumb terminals, or environments where detection is unreliable.

### Customization

Pass a partial palette to `createColorino`. Unspecified log levels fall back to the detected or selected theme.

Colorino targets the highest color depth supported by the environment. If the terminal only supports ANSI-16, hex values are mapped to the nearest ANSI color.

Passing an invalid color value (e.g. malformed hex) throws an `InputValidationError` at construction time.

```typescript
import { createColorino } from 'colorino'

const myLogger = createColorino({ error: '#ff007b' })

myLogger.error('Oh no!')
myLogger.info('Still styled by theme.')
```

### Supported Environment Variables

| Variable | Effect | Example |
| --- | --- | --- |
| `NO_COLOR` | Disables all colors (any value) | `NO_COLOR=1 node app.js` |
| `FORCE_COLOR` | Override color depth: `0`=none, `1`=16, `2`=256, `3`=RGB | `FORCE_COLOR=3 node app.js` |
| `CLICOLOR` | `0` disables colors | `CLICOLOR=0 node app.js` |
| `CLICOLOR_FORCE` | `1` forces colors even when piped | `CLICOLOR_FORCE=1 node app.js` |
| `TERM` | Terminal type (e.g. `xterm-256color`) — set by terminal | `TERM=xterm-256color` |
| `COLORTERM` | `truecolor` or `24bit` enables full RGB — set by terminal | `COLORTERM=truecolor` |
| `TERM_PROGRAM` | Terminal name for OSC 11 detection — set by terminal | (automatic) |
| `VTE_VERSION` | VTE version for OSC 11 detection — set by GNOME Terminal | (automatic) |
| `WT_SESSION` | Set by Windows Terminal for OSC 11 support | (automatic) |
| `CI` | Set by CI systems (GitHub Actions, GitLab CI, etc.) to disable colors | `CI=true` |

### Colorize Helper (`colorize(text, hex)`)

Applies a specific hex color to a single string without modifying the global palette. Returns plain text when color is disabled.

```ts
import { colorino } from 'colorino'

const important = colorino.colorize('IMPORTANT', '#ff5733')
colorino.info(important, 'Something happened')
```

### Browser-only CSS Helper (`css(text, style)`)

Applies arbitrary CSS to a console segment using the `%c` formatter. No-op outside browser environments.

```ts
import { colorino } from 'colorino'

const badge = colorino.css('NEW', {
  color: 'white',
  'background-color': '#e91e63',
  'font-weight': 'bold',
  'border-radius': '4px',
  padding: '2px 6px',
})

colorino.info('Release status:', badge, 'shipped')
```

### Gradient Text (`gradient(text, startHex, endHex)`)

Interpolates colors across each character of `text` from `startHex` to `endHex`. Requires ANSI-256 or Truecolor support.

```ts
import { colorino } from 'colorino'

const rainbow = colorino.gradient('Hello Gradient!', '#ff0000', '#0000ff')
colorino.log(rainbow)
```

## API Reference

### 1. `colorino` (default instance)

A pre-configured logger using auto theme detection. No setup required.

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.debug(...args)`
- `.trace(...args)`
- `.colorize(text, hex)`
- `.css(text, style)` (browser only)
- `.gradient(text, startHex, endHex)`

### 2. `createColorino(palette?, options?)` (factory)

Returns a new logger instance with the given palette and options.

- `palette` (`Partial<Palette>`): Per-level color overrides (e.g. `{ error: '#ff007b' }`)
- `options` (`ColorinoOptions`): Behavior options — see [Options & Theme Overrides](#options--theme-overrides)

## Extending Colorino

Create a base instance via `createColorino()`, then compose extensions by overriding specific methods via `Object.assign`. This avoids subclassing and keeps the type surface intact.

### Use Case: Automatic File/Context Info

Prefixes `.info()` and `.error()` calls with caller context derived from a synthetic `Error` stack.

```ts
import {
  createColorino,
  type ColorinoOptions,
  type Palette,
} from 'colorino'

type ColorinoType = ReturnType<typeof createColorino>

function getCallerContext(): string {
  const err = new Error()
  if (!err.stack) return 'unknown'

  const lines = err.stack.split('\n').slice(2)
  const frame = lines[0] ?? ''

  const match =
    frame.match(/at (.+?) \((.+?):(\d+):\d+\)/) ??
    frame.match(/at (.+?):(\d+):\d+/)

  if (!match) return frame.trim() || 'unknown'

  const [_, maybeFn, fileOrLine, maybeLine] = match
  const file = maybeLine ? fileOrLine : maybeFn
  const line = maybeLine ?? fileOrLine

  return `${file}:${line}`
}

export function createContextLogger(
  palette?: Partial<Palette>,
  options?: ColorinoOptions
): ColorinoType {
  const base = createColorino(palette, options)
  const logger = Object.create(base) as ColorinoType

  Object.assign(logger, {
    info(...args: unknown[]) {
      base.info(`[${getCallerContext()}]`, ...args)
    },
    error(...args: unknown[]) {
      base.error(`[${getCallerContext()}]`, ...args)
    },
  })

  return logger
}

const logger = createContextLogger({}, { theme: 'dracula' })
logger.info('User created', { id: 123 })
logger.error('Failed to load user', { id: 456 })
```

## License

[MIT](LICENSE.md)
