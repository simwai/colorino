# <a id="0"></a>🎨 Colorino

**The zero‑configuration, context‑aware `console` logger for Node.js and the browser—with smart theming and graceful color degradation.**

Colorino automatically adapts its palette to your terminal or browser DevTools theme, and degrades colors gracefully so your logs stay readable and on‑brand even in limited environments

![Demo](https://github.com/simwai/colorino/blob/master/demo-ps.png?raw=true)

# <a id="0"></a><a id="0"></a>

- [Why use Colorino?](#1)
- [Features](#2)
- [Installation](#3)
- [Browser via CDN (unpkg)](#4)
- [Usage](#5)
  - [Quick Start](#5-1)
  - [Creating a Custom Logger](#5-2)
  - [Options & Theme Overrides](#5-3)
    - [Available Theme Presets](#5-3-1)
    - [Examples](#5-3-2)
  - [Customization](#5-4)
  - [Supported Environment Variables](#5-5)
- [Colorino vs. Chalk](#6)
- [API Reference](#7)
  - [1. `colorino` (default instance)](#7-1)
  - [2. `createColorino(palette?, options?)` (factory)](#7-2)
- [Extending Colorino](#8)
  - [Use case: automatic file/context info](#8-1)
- [Internals & Dependencies](#9)
  - [Why This Pattern?](#9-1)
- [License](#10)

<!-- Table of contents is made with https://github.com/eugene-khyst/md-toc-cli -->

## <a id="1"></a>Why use Colorino?

Plain `console.log` is colorless and inconsistent. Libraries like `chalk` let you style strings, but you have to decorate every message and manually manage color choices.

Colorino is different: it’s a "batteries-included" logging facade with beautiful, theme-aware colors and a familiar API—no learning curve, no configuration. Instantly upgrade your logs everywhere.

## <a id="2"></a>Features

- 🎨 **Smart Theming:** Automatically detects *dark/light* mode and applies a high‑contrast base palette by default (Dracula for dark, GitHub Light for light); opt into a coordinated theme preset when you want richer colors.
- 🤘 **Graceful Color Degradation**: Accepts rich colors (hex/RGB) and automatically down‑samples to the best ANSI‑16/ANSI‑256/Truecolor match for the current environment.​
- 🤝 **Familiar API:** If you know `console.log`, you already know Colorino: all standard log levels are supported.
- 🔀 **Environment-Aware:** Works in **Node.js** (ANSI color and truecolor) and all major **Browsers** (CSS styles).
- ⚡️ **Fast, Lightweight:** Minimal dependencies, works great in modern frameworks and CLIs.
- 🔒 **Robust:** Handles bad inputs and weird environments safely.
- 🛠️ **Customizable:** Override individual log colors for your own branding.

## <a id="3"></a>Installation

```bash
npm install colorino
```

## <a id="4"></a>Browser via CDN (unpkg)

You can use Colorino directly in the browser without any build step.

**ESM (recommended):**

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { colorino } from 'https://unpkg.com/colorino/dist/browser.bundle.mjs';

      colorino.info('Hello from the browser!');
      colorino.error('Something went wrong');
    </script>
  </head>
  <body></body>
</html>
```

CommonJS-style bundle:

```HTML
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/colorino/dist/browser.bundle.cjs"></script>
    <script>
      // `colorino` is exposed as a global
      colorino.info('Hello from the CJS bundle!');
    </script>
  </head>
  <body></body>
</html>
```

## <a id="5"></a>Usage

### <a id="5-1"></a>Quick Start

Just import the default instance and log away!

```typescript
import { createColorino } from 'colorino'

// All log levels automatically themed
logger.error('A critical error!')
logger.warn('A warning message.')
logger.info('Useful info logging.')
logger.log('A plain log.')
logger.debug('Debug with objects:', { x: 5, y: 9 })
logger.trace('Tracing app start...')
```

### <a id="5-2"></a>Creating a Custom Logger

Need your own colors or different settings?
Use the factory to create as many loggers as you want (each with its own palette and options):

```typescript
import { createColorino } from 'colorino'

const myLogger = createColorino(
  { // Palette (partial)
    error: '#ff007b',
    info: '#3498db'
  },
  { disableWarnings: true } // Options (see below)
)
myLogger.error('Critical!')
myLogger.info('Rebranded info!')
```

### <a id="5-3"></a>Options & Theme Overrides

`createColorino(palette?, options?)` accepts:

| Option            | Type                                 | Default | Description                                                                 |
|-------------------|--------------------------------------|---------|-----------------------------------------------------------------------------|
| `disableWarnings` | `boolean`                           | `false` | Suppress warnings when color support can't be detected or is disabled.      |
| `theme`           | `ThemeOption` (see below)           | `'auto'`| Control the active color theme or force a specific mode.                    |
| `disableOscProbe` | `boolean`                           | `false` | Disable OSC 11 terminal theme probing (use only env heuristics for theme).  |
| `maxDepth`        | `number`                            | `5`     | Maximum depth when pretty-printing objects in log output.                   |

**`theme` accepts three types of values:**

1. **`'auto'`** (Default): Automatically detects your terminal or browser theme (dark/light) and applies the matching default preset.  
When combined with `disableOscProbe: true`, only environment variables are used for theme detection (no OSC 11 probe).
2. **`'dark' | 'light'`**: Forces the logger into a specific mode using the default preset for that mode.
3. **`ThemeName`**: Forces a specific built-in palette (e.g., `'dracula'`).

#### <a id="5-3-1"></a>Available Theme Presets

Pass any of these names to the `theme` option to use a specific palette:

| Theme Name           | Type            | Description                                      |
|----------------------|-----------------|--------------------------------------------------|
| `'dracula'`          | **Dark** (High Contrast) | Vibrant pinks, purples, and cyans.               |
| `'catppuccin-mocha'` | **Dark** (Low Contrast)  | Soothing pastel colors.                          |
| `'github-light'`     | **Light** (High Contrast)| Clean, sharp, high-contrast.                     |
| `'catppuccin-latte'` | **Light** (Low Contrast) | Warm, cozy light mode with soft colors.          |

In auto mode, Colorino uses dracula in dark environments and github-light in light environments.

#### <a id="5-3-2"></a>Examples

**1. Default palette with custom branding:**
Set only the colors you care about; everything else uses the detected base theme or your explicitly selected theme.

```typescript
// Only customize error and warn
const myLogger = createColorino({ 
  error: '#ff007b',
  warn: '#ffa500'
})

// Detected dark terminal (uses dracula as base):
// - error: #ff007b (your custom red)
// - warn: #ffa500 (your custom orange)  
// - info: #8be9fd (dracula cyan)
// - log: #f8f8f2 (dracula foreground)
// - debug: #bd93f9 (dracula purple)
// - trace: #6272a4 (dracula comment)

// Detected light terminal (uses github-light as base):
// - error: #ff007b (your custom red)
// - warn: #ffa500 (your custom orange)
// - info: #0366d6 (github blue)
// - log: #24292e (github text)
// - debug: #586069 (github gray)
// - trace: #6a737d (github gray-light)
```

**2. Use a specific preset:**
Instant branding with zero configuration.

```typescript
// Forces the Dracula palette
const draculaLogger = createColorino({}, { theme: 'dracula' })
```

**3. Customize a preset:**
Overlay your own colors on top of a built-in theme.

```typescript
// Use GitHub Light but with a custom error color
const myLogger = createColorino(
  { error: '#ff007b' }, 
  { theme: 'github-light' }
)
```

**4. Force a specific mode (uses defaults):**
Useful for environments where detection fails.

```typescript
// Forces dark mode using the default palette
const darkLogger = createColorino({}, { theme: 'dark' })
```

> **Tip:**
> Forcing `'dark'` or `'light'` bypasses automatic theming, ensuring predictable colors in environments with unknown or unsupported theme detection (like some CI pipelines, dumb terminals, or minimal browsers).

### <a id="5-4"></a>Customization

Use your brand colors by passing a partial palette to the `createColorino` factory. Any log levels you don't specify will use the detected **minimal** defaults (`minimal-dark` / `minimal-light`) unless you explicitly select a theme preset.

Colorino always targets the highest color fidelity supported by the environment. If your palette uses hex colors but only ANSI‑16 is available, Colorino computes the nearest ANSI color so your branding stays recognizable, even on limited terminals.

If you pass an invalid color value (e.g. malformed hex) in a custom palette, Colorino throws an InputValidationError at creation time so broken palettes fail fast.

```typescript
import { createColorino } from 'colorino'

// Custom error color; others use theme defaults
const myLogger = createColorino({ error: '#ff007b' })

myLogger.error('Oh no!') // Uses your custom color
myLogger.info('Still styled by theme.') // Uses the default theme color
```

### <a id="5-5"></a>Supported Environment Variables

Colorino auto-detects your environment and color support, but you can override behavior using these standard environment variables (compatible with Chalk):

| Variable        | Effect                                                                                   | Example                              |
|-----------------|------------------------------------------------------------------------------------------|--------------------------------------|
| `NO_COLOR`      | Forces no color output                                                                   | `NO_COLOR=1 node app.js`            |
| `FORCE_COLOR`   | Forces color level: `0`=off, `1`=ANSI‑16, `2`=ANSI‑256, `3`=Truecolor                    | `FORCE_COLOR=3 node app.js`         |
| `CLICOLOR`      | `"0"` disables color                                                                     | `CLICOLOR=0 node app.js`            |
| `CLICOLOR_FORCE`| Non‑`"0"` value enables color even if not a TTY                                          | `CLICOLOR_FORCE=1 node app.js`      |
| `TERM`          | Terminal type; may influence color support                                               | `TERM=xterm-256color`               |
| `COLORTERM`     | `'truecolor'` or `'24bit'` enables truecolor                                             | `COLORTERM=truecolor`               |
| `WT_SESSION`    | Enables color detection for Windows Terminal                                             |                                      |
| `CI`            | Many CI platforms default to no color                                                    | `CI=1 node app.js`                  |

## <a id="6"></a>Colorino vs. Chalk

| Feature                  | 🎨 **Colorino**            | 🖍️ **Chalk**    |
|--------------------------|----------------------------|-----------------|
| Out-of-box logs          | ✔ themed, all log levels   | ✘ string styling|
| Zero-config              | ✔                          | ✘ manual, per-use|
| Node + browser           | ✔                          | ✘ (Node only)   |
| CSS console logs         | ✔                          | ✘               |
| Extensible / Composable  | ✔ (via factory)            | ✘               |

## <a id="7"></a>API Reference

The `colorino` package exports two main items:

### <a id="7-1"></a>1. `colorino` (default instance)

A pre-configured, zero-setup logger instance. Just import and use.

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.debug(...args)`
- `.trace(...args)`

### <a id="7-2"></a>2. `createColorino(palette?, options?)` (factory)

A factory function to create your own customized logger instances.

- `palette` (`Partial<Palette>`): An object to override default colors for specific log levels (e.g., `{ error: '#ff007b' }`).
- `options` (`ColorinoOptions`): An object to control behavior:
  - `disableWarnings: boolean` (default `false`): Suppress warnings on environments with no color support.
  - `theme: 'dark' | 'light'` (default `auto`): Force a specific theme instead of auto-detecting.

## <a id="8"></a>Extending Colorino

Colorino is designed for composition: create a base logger via `createColorino()`, then extend it by inheriting from the base and overriding only the methods you need.

### <a id="8-1"></a>Use case: automatic file/context info

This example prefixes every `.info()` and `.error()` call with best‑effort caller context (file/line) derived from a synthetic `Error` stack.

```ts
import { createColorino, type Colorino, type ColorinoOptions, type Palette } from 'colorino'

function getCallerContext(): string {
  const err = new Error()
  if (!err.stack) return 'unknown'

  const lines = err.stack.split('\n').slice(2) // skip "Error" + current frame
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
  options?: ColorinoOptions,
): Colorino {
  const base = createColorino(palette, options)

  // Inherit all default methods from the base logger...
  const logger = Object.create(base) as Colorino // Object.create uses `base` as the prototype. 

  // ...and override only what you need.
  Object.assign(logger, { // Object.assign copies these methods onto `logger`.
    info(...args: unknown[]) {
      base.info(`[${getCallerContext()}]`, ...args)
    },
    error(...args: unknown[]) {
      base.error(`[${getCallerContext()}]`, ...args)
    },
  })

  return logger
}

// Usage
const logger = createContextLogger({}, { theme: 'dracula' })
logger.info('User created', { id: 123 })
logger.error('Failed to load user', { id: 456 })
```

## <a id="9"></a>Internals & Dependencies

- Colorino’s runtime logic depends on a single bundled library, `neverthrow`, which is MIT‑licensed and used for type‑safe Result handling.
- `neverthrow` is bundled into the published artifacts, so you do not need to install it separately; your application sees a single runtime dependency: Colorino itself.

### <a id="9-1"></a>Why This Pattern?

- **Composition > Inheritance**: No fragile base class problems
- **Type Safe**: TypeScript infers the return type correctly
- **Future Proof**: Works even if colorino's internal implementation changes
- **Clean**: No messing with `super()` or constructor parameters
- **Composable**: You can layer multiple extensions

## <a id="10"></a>License

[MIT](LICENSE.md)
