- [Browser via CDN (unpkg)](#1)
  - [ESM (Recommended)](#1-1)
  - [UMD (Classic `<script>`)](#1-2)
- [Usage](#2)
  - [Quick Start](#2-1)
  - [Creating a Custom Logger](#2-2)
  - [Options & Theme Overrides](#2-3)
    - [Available Theme Presets](#2-3-1)
    - [Examples](#2-3-2)
  - [Customization](#2-4)
  - [Supported Environment Variables](#2-5)
  - [Colorize Helper (Manual Overrides) (`colorize(text, hex)`)](#2-6)
  - [Browser‑only CSS Helper (`css(text, style)`)](#2-7)
  - [Gradient Text (`gradient(text, startHex, endHex)`)](#2-8)
- [API Reference](#3)
  - [1. `colorino` (default instance)](#3-1)
  - [2. `createColorino(palette?, options?)` (factory)](#3-2)
- [Extending Colorino](#4)
  - [Use Case: Automatic File/Context Info](#4-1)
- [License](#5)

<!-- Table of contents is made with https://github.com/eugene-khyst/md-toc-cli -->

pnpm add colorino

````

## <a id="1"></a>Browser via CDN (unpkg)

### <a id="1-1"></a>ESM (Recommended)

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
````

Non-minified (for debugging):

```html

  import { colorino } from 'https://unpkg.com/colorino/dist/cdn.mjs'
</script>
```

### <a id="1-2"></a>UMD (Classic `<script>`)

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

## <a id="2"></a>Usage

### <a id="2-1"></a>Quick Start

```typescript
import { colorino } from 'colorino'

colorino.error('A critical error!')
colorino.warn('A warning message.')
colorino.info('Useful info logging.')
colorino.log('A plain log.')
colorino.debug('Debug with objects:', { x: 5, y: 9 })
colorino.trace('Tracing app start...')
```

### <a id="2-2"></a>Creating a Custom Logger

```typescript
import { createColorino } from 'colorino'

const myLogger = createColorino({
  error: '#ff007b',
  info: '#3498db',
})
myLogger.error('Critical!')
myLogger.info('Rebranded info!')
```

### <a id="2-3"></a>Options & Theme Overrides

`createColorino(palette?, options?)` accepts:

| Option                     | Type                      | Default  | Description                                                                                                              |
| -------------------------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `theme`                    | `ThemeOption` (see below) | `'auto'` | Control the active color theme or force a specific mode.                                                                 |
| `maxDepth`                 | `number`                  | `5`      | Maximum depth when pretty-printing objects in log output.                                                                |
| `areNodeFramesVisible`     | `boolean`                 | `true`   | Show Node.js internal frames (e.g., `node:internal/...`) in stack traces.                                                |
| `areColorinoFramesVisible` | `boolean`                 | `false`  | Show Colorino internal frames in stack traces (useful for debugging Colorino).                                           |
| `isOsc11Enabled`           | `boolean`                 | `true`   | Enables auto light/dark theme detection via OSC 11. Disable if it causes crashes or unwanted behaviour in your terminal. |

**`theme` values:**

- `'auto'` (default) — detects terminal or browser theme and applies the matching preset
- `'dark' | 'light'` — forces the matching default preset regardless of detected theme
- `ThemeName` — forces a specific built-in palette (e.g. `'dracula'`)

#### <a id="2-3-1"></a>Available Theme Presets

| Theme Name           | Type                  | Description               |
| -------------------- | --------------------- | ------------------------- |
| `'dracula'`          | Dark (High Contrast)  | Pinks, purples, and cyans |
| `'catppuccin-mocha'` | Dark (Low Contrast)   | Pastel colors             |
| `'github-light'`     | Light (High Contrast) | High-contrast             |
| `'catppuccin-latte'` | Light (Low Contrast)  | Soft warm tones           |

In `auto` mode: `dracula` in dark environments, `github-light` in light environments.

#### <a id="2-3-2"></a>Examples

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

### <a id="2-4"></a>Customization

Pass a partial palette to `createColorino`. Unspecified log levels fall back to the detected or selected theme.

Colorino targets the highest color depth supported by the environment. If the terminal only supports ANSI-16, hex values are mapped to the nearest ANSI color.

Passing an invalid color value (e.g. malformed hex) throws an `InputValidationError` at construction time.

```typescript
import { createColorino } from 'colorino'

const myLogger = createColorino({ error: '#ff007b' })

myLogger.error('Oh no!')
myLogger.info('Still styled by theme.')
```

### <a id="2-5"></a>Supported Environment Variables

| Variable         | Effect                                                                | Example                        |
| ---------------- | --------------------------------------------------------------------- | ------------------------------ |
| `NO_COLOR`       | Disables all colors (any value)                                       | `NO_COLOR=1 node app.js`       |
| `FORCE_COLOR`    | Override color depth: `0`=none, `1`=16, `2`=256, `3`=RGB              | `FORCE_COLOR=3 node app.js`    |
| `CLICOLOR`       | `0` disables colors                                                   | `CLICOLOR=0 node app.js`       |
| `CLICOLOR_FORCE` | `1` forces colors even when piped                                     | `CLICOLOR_FORCE=1 node app.js` |
| `TERM`           | Terminal type (e.g. `xterm-256color`) — set by terminal               | `TERM=xterm-256color`          |
| `COLORTERM`      | `truecolor` or `24bit` enables full RGB — set by terminal             | `COLORTERM=truecolor`          |
| `TERM_PROGRAM`   | Terminal name for OSC 11 detection — set by terminal                  | (automatic)                    |
| `VTE_VERSION`    | VTE version for OSC 11 detection — set by GNOME Terminal              | (automatic)                    |
| `WT_SESSION`     | Set by Windows Terminal for OSC 11 support                            | (automatic)                    |
| `CI`             | Set by CI systems (GitHub Actions, GitLab CI, etc.) to disable colors | `CI=true`                      |

### <a id="2-6"></a>Colorize Helper (Manual Overrides) (`colorize(text, hex)`)

Applies a specific hex color to a single string without modifying the global palette. Returns plain text when color is disabled.

```ts
import { colorino } from 'colorino'

const important = colorino.colorize('IMPORTANT', '#ff5733')
colorino.info(important, 'Something happened')
```

### <a id="2-7"></a>Browser‑only CSS Helper (`css(text, style)`)

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

### <a id="2-8"></a>Gradient Text (`gradient(text, startHex, endHex)`)

Interpolates colors across each character of `text` from `startHex` to `endHex`. Requires ANSI-256 or Truecolor support.

```ts
import { colorino } from 'colorino'

const rainbow = colorino.gradient('Hello Gradient!', '#ff0000', '#0000ff')
colorino.log(rainbow)
```

## <a id="3"></a>API Reference

### <a id="3-1"></a>1. `colorino` (default instance)

A pre-configured logger using auto theme detection.

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.debug(...args)`
- `.trace(...args)`
- `.colorize(text, hex)`
- `.css(text, style)` (browser only)
- `.gradient(text, startHex, endHex)`

### <a id="3-2"></a>2. `createColorino(palette?, options?)` (factory)

Returns a new `ColorinoNode` instance with the given palette and options.

- `palette` (`Partial<Palette>`): Per-level color overrides (e.g. `{ error: '#ff007b' }`)
- `options` (`ColorinoOptions`): Behavior options — see [Options & Theme Overrides](#4-3)

## <a id="4"></a>Extending Colorino

`createColorino` returns a `ColorinoNode` class instance. Extend it via `extends ColorinoNode` and use `override` for existing methods or add new ones directly.

### <a id="4-1"></a>Use Case: Automatic File/Context Info

Overrides `.info()` and `.error()` to prefix each call with caller context derived from a synthetic `Error` stack.

```ts
import { ColorinoNode } from 'colorino/node'
import type { ColorinoOptions, Palette } from 'colorino'

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

class ContextLogger extends ColorinoNode {
  override info(...args: unknown[]): void {
    super.info(`[${getCallerContext()}]`, ...args)
  }

  override error(...args: unknown[]): void {
    super.error(`[${getCallerContext()}]`, ...args)
  }
}

const logger = new ContextLogger(
  finalPalette,
  userPalette,
  validator,
  colorLevel,
  { theme: 'dracula' }
)
logger.info('User created', { id: 123 })
logger.error('Failed to load user', { id: 456 })
```

## <a id="5"></a>License

[MIT](LICENSE.md)
