# <a id="0"></a>Colorino 🎨

[![NPM Version](https://img.shields.io/npm/v/colorino)](https://www.npmjs.com/package/colorino)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, high-performance TypeScript logger for Node.js and the Browser. Supports auto-detected themes, hex-to-ANSI mapping, gradients, and custom palettes.

## <a id="1"></a>Table of Contents

## <a id="2"></a>Installation

### <a id="2-1"></a>NPM / PNPM / Yarn

```bash
npm install colorino
# <a id="0"></a>or

- [Table of Contents](#1)
- [Installation](#2)
  - [NPM / PNPM / Yarn](#2-1)
  - [CDN (Browser Only)](#2-2)
    - [ESM](#2-2-1)
    - [UMD](#2-2-2)
- [Usage](#3)
  - [Quick Start](#3-1)
  - [Creating a Custom Logger](#3-2)
  - [Options & Theme Overrides](#3-3)
    - [Available Theme Presets](#3-3-1)
    - [Examples](#3-3-2)
    - [Log Level Filtering](#3-3-3)
    - [Metadata & Call-site Info](#3-3-4)
    - [File Logging (Node.js Only)](#3-3-5)
  - [Customization](#3-4)
  - [Supported Environment Variables](#3-5)
  - [Colorize Helper (`colorize(text, hex)`)](#3-6)
  - [Browser‑only CSS Helper (`css(text, style)`)](#3-7)
  - [Gradient Text (`gradient(text, startHex, endHex)`)](#3-8)
- [API Reference](#4)
  - [1. `colorino` (default instance)](#4-1)
  - [2. `createColorino(palette?, options?)`](#4-2)
- [Extending Colorino](#5)
- [License](#6)

<!-- Table of contents is made with https://github.com/eugene-khyst/md-toc-cli -->
pnpm add colorino
```

### <a id="2-2"></a>CDN (Browser Only)

#### <a id="2-2-1"></a>ESM

```html
<script type="module">
  import { colorino } from 'https://unpkg.com/colorino/dist/cdn.mjs'
</script>
```

#### <a id="2-2-2"></a>UMD

```html
<script src="https://unpkg.com/colorino/dist/cdn.min.js"></script>
<script>
  colorino.info('Hello from the UMD bundle!')
</script>
```

## <a id="3"></a>Usage

### <a id="3-1"></a>Quick Start

```typescript
import { colorino } from 'colorino'

colorino.fatal('Critical system failure!')
colorino.error('A critical error!')
colorino.warn('A warning message.')
colorino.info('Useful info logging.')
colorino.log('A plain log.')
colorino.debug('Debug with objects:', { x: 5, y: 9 })
colorino.trace('Tracing app start...')
```

### <a id="3-2"></a>Creating a Custom Logger

```typescript
import { createColorino } from 'colorino'

const myLogger = createColorino({
  error: '#ff007b',
  info: '#3498db',
})
myLogger.error('Critical!')
myLogger.info('Rebranded info!')
```

### <a id="3-3"></a>Options & Theme Overrides

`createColorino(palette?, options?)` accepts:

| Option                     | Type                | Default  | Description                                                                                      |
| -------------------------- | ------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `theme`                    | `ThemeOption`       | `'auto'` | Control the active color theme or force a specific mode (`'dark'`, `'light'`, or a `ThemeName`). |
| `maxDepth`                 | `number`            | `5`      | Maximum depth when pretty-printing objects in log output.                                        |
| `areNodeFramesVisible`     | `boolean`           | `true`   | Show Node.js internal frames (e.g., `node:internal/...`) in stack traces.                        |
| `areColorinoFramesVisible` | `boolean`           | `false`  | Show Colorino internal frames in stack traces (useful for debugging Colorino).                   |
| `isOsc11Enabled`           | `boolean`           | `true`   | Enables auto light/dark theme detection via OSC 11.                                              |
| `logLevel`                 | `LogLevelOptions`   | -        | Configure log level filtering (min level, allow-list, deny-list).                                |
| `metadata`                 | `MetadataOptions`   | -        | Attach metadata tags like call-site info to every log call.                                      |
| `fileLogging`              | `FileLoggingConfig` | -        | Write logs to a local file (Node.js only).                                                       |

#### <a id="3-3-1"></a>Available Theme Presets

| Theme Name           | Type                  | Description               |
| -------------------- | --------------------- | ------------------------- |
| `'dracula'`          | Dark (High Contrast)  | Pinks, purples, and cyans |
| `'catppuccin-mocha'` | Dark (Low Contrast)   | Pastel colors             |
| `'github-light'`     | Light (High Contrast) | High-contrast             |
| `'catppuccin-latte'` | Light (Low Contrast)  | Soft warm tones           |

#### <a id="3-3-2"></a>Examples

**Force a theme mode:**

```typescript
const darkLogger = createColorino({}, { theme: 'dark' })
```

**Partial palette override on top of auto-detected theme:**

```typescript
const myLogger = createColorino({
  error: '#ff007b',
  warn: '#ffa500',
})
```

#### <a id="3-3-3"></a>Log Level Filtering

You can filter logs based on their priority using `min`, or explicitly allow/deny specific levels.

```typescript
const logger = createColorino(
  {},
  {
    logLevel: {
      min: 'info', // Ignore 'debug' and 'trace'
      deny: ['warn'], // Specifically silence warnings
      // allow: ['error']   // If set, ONLY these levels are logged
    },
  }
)
```

Levels in order of priority: `trace` < `debug` < `log` | `info` < `warn` < `error` < `fatal`.

#### <a id="3-3-4"></a>Metadata & Call-site Info

Colorino can automatically extract and display the file, line number, and function name of the log caller.

```typescript
const logger = createColorino(
  {},
  {
    metadata: {
      callSite: {
        isEnabled: true,
        isCallerFunctionVisible: true,
        isCallerPathRelative: true,
        position: 'prefix', // 'prefix' or 'postfix'
      },
    },
  }
)

// Output: [main.ts:10:5@someFunction] Your message...
```

**CallSiteConfig properties:**

- `isEnabled`: (`boolean`) Enable/disable call-site tags.
- `position`: (`'prefix' | 'postfix'`) Where to place the tag.
- `isCallerFileVisible`: (`boolean`) Show filename. Default `true`.
- `isCallerFunctionVisible`: (`boolean`) Show function name. Default `false`.
- `isCallerLineVisible`: (`boolean`) Show line number. Default `true`.
- `isCallerColumnVisible`: (`boolean`) Show column number. Default `true`.
- `isCallerPathRelative`: (`boolean`) Show path relative to `cwd()` (Node only). Default `false`.

#### <a id="3-3-5"></a>File Logging (Node.js Only)

Stream logs asynchronously to a local file.

```typescript
const logger = createColorino(
  {},
  {
    fileLogging: {
      isEnabled: true,
      path: './logs/app.log',
      isAppendMode: true, // true = append, false = overwrite
      minLevel: 'error', // only write errors or higher to file
    },
  }
)
```

### <a id="3-4"></a>Customization

Pass a partial palette to `createColorino`. Unspecified log levels fall back to the theme.

Colorino targets the highest color depth supported by the environment. If the terminal only supports ANSI-16, hex values are mapped to the nearest ANSI color.

Passing an invalid color value throws a `ColorinoConfigError` or `InputValidationError` at construction time.

### <a id="3-5"></a>Supported Environment Variables

- `NO_COLOR`: Disables all colors.
- `FORCE_COLOR`: Override color depth (`0`=none, `1`=16, `2`=256, `3`=RGB).
- `CLICOLOR`: `0` disables colors.
- `CLICOLOR_FORCE`: `1` forces colors.

### <a id="3-6"></a>Colorize Helper (`colorize(text, hex)`)

Applies a specific hex color to a single string. Returns a styled string (Node) or a special object (Browser).

```ts
const important = colorino.colorize('IMPORTANT', '#ff5733')
colorino.info(important, 'Something happened')
```

### <a id="3-7"></a>Browser‑only CSS Helper (`css(text, style)`)

Applies arbitrary CSS to a console segment.

```ts
const badge = colorino.css('NEW', {
  color: 'white',
  'background-color': '#e91e63',
  'font-weight': 'bold',
  padding: '2px 6px',
})
```

### <a id="3-8"></a>Gradient Text (`gradient(text, startHex, endHex)`)

Interpolates colors across characters.

```ts
const rainbow = colorino.gradient('Hello Gradient!', '#ff0000', '#0000ff')
colorino.log(rainbow)
```

## <a id="4"></a>API Reference

### <a id="4-1"></a>1. `colorino` (default instance)

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.fatal(...args)`
- `.debug(...args)`
- `.trace(...args)`
- `.colorize(text, hex)`
- `.css(text, style)` (Browser only)
- `.gradient(text, startHex, endHex)`

### <a id="4-2"></a>2. `createColorino(palette?, options?)`

Returns a new logger instance.

- `palette` (`Partial<Palette>`): Per-level hex color overrides.
- `options` (`ColorinoOptions`): See [Options & Theme Overrides](#2-3).

## <a id="5"></a>Extending Colorino

Extend `ColorinoNode` (Node) or `ColorinoBrowser` (Browser) to add custom behavior.

```ts
import { ColorinoNode } from 'colorino/node'

class MyLogger extends ColorinoNode {
  success(message: string) {
    this.info('✅', message)
  }
}
```

## <a id="6"></a>License

[MIT](LICENSE.md)
