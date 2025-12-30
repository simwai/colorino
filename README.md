# <a id="0"></a>🎨 Colorino

**The zero-configuration, context-aware `console` logger for Node.js and the browser.**

Colorino automatically adapts its palette to your terminal or browser DevTools theme, and defaults to **minimal, high-contrast** colors unless you opt into a specific theme preset.

# <a id="0"></a><a id="0"></a>

- [Why use Colorino?](#1)
- [Features](#2)
- [Installation](#3)
- [Usage](#4)
  - [Quick Start](#4-1)
  - [Creating a Custom Logger](#4-2)
  - [Options & Theme Overrides](#4-3)
    - [Available Theme Presets](#4-3-1)
    - [Examples](#4-3-2)
  - [Customization](#4-4)
  - [Supported Environment Variables](#4-5)
- [Colorino vs. Chalk](#5)
- [API Reference](#6)
  - [1. `colorino` (default instance)](#6-1)
  - [2. `createColorino(palette?, options?)` (factory)](#6-2)
- [Extending Colorino](#7)
  - [Why This Pattern?](#7-1)
- [License](#8)

<!-- Table of contents is made with https://github.com/eugene-khyst/md-toc-cli -->

## <a id="1"></a>Why use Colorino?

Plain `console.log` is colorless and inconsistent. Libraries like `chalk` let you style strings, but you have to decorate every message and manually manage color choices.

Colorino is different: it’s a "batteries-included" logging facade with beautiful, theme-aware colors and a familiar API—no learning curve, no configuration. Instantly upgrade your logs everywhere.

## <a id="2"></a>Features

- 🎨 **Smart Theming:** Automatically detects *dark/light* mode and applies a **minimal** high-contrast base palette by default; opt into a coordinated theme preset when you want richer colors.
- 🤝 **Familiar API:** If you know `console.log`, you already know Colorino: all standard log levels are supported.
- 🔀 **Environment-Aware:** Works in **Node.js** (ANSI color and truecolor) and all major **Browsers** (CSS styles).
- ⚡️ **Fast, Lightweight:** Minimal dependencies, works great in modern frameworks and CLIs.
- 🔒 **Robust:** Handles bad inputs and weird environments safely.
- 🛠️ **Customizable:** Override individual log colors for your own branding.

## <a id="3"></a>Installation

```bash
npm install colorino
```

## <a id="4"></a>Usage

### <a id="4-1"></a>Quick Start

Just import the default instance and log away!

```typescript
import { colorino } from 'colorino'

// All log levels automatically themed
colorino.error('A critical error!')
colorino.warn('A warning message.')
colorino.info('Useful info logging.')
colorino.log('A plain log.')
colorino.debug('Debug with objects:', { x: 5, y: 9 })
colorino.trace('Tracing app start...')
```

### <a id="4-2"></a>Creating a Custom Logger

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

### <a id="4-3"></a>Options & Theme Overrides

`createColorino(palette?, options?)` accepts:

| Option            | Type                           | Default | Description                                                                    |
|-------------------|--------------------------------|---------|--------------------------------------------------------------------------------|
| `disableWarnings` | `boolean`                      | `false` | Suppress warnings when color support can't be detected or is disabled.         |
| `theme`           | `ThemeOption` (see below)      | `'auto'`| Control the active color theme or force a specific mode.                       |

**`theme` accepts three types of values:**

1. **`'auto'`** (Default): Automatically detects your terminal or browser theme (dark/light) and applies the matching default preset.
2. **`'dark' | 'light'`**: Forces the logger into a specific mode using the default preset for that mode.
3. **`ThemeName`**: Forces a specific built-in palette (e.g., `'dracula'`).

#### <a id="4-3-1"></a>Available Theme Presets

Pass any of these names to the `theme` option to use a specific palette:

| Theme Name           | Type            | Description                                      |
|----------------------|-----------------|--------------------------------------------------|
| `'dracula'`          | **Dark** (High) | Vibrant pinks, purples, and cyans.               |
| `'catppuccin-mocha'` | **Dark** (Low)  | Soothing pastel colors.                          |
| `'minimal-dark'`     | **Dark**        | *Default Dark (auto).* Minimal, high-contrast.   |
| `'minimal-light'`    | **Light**       | *Default Light (auto).* Minimal, high-contrast.  |
| `'github-light'`     | **Light** (High)| Clean, sharp, high-contrast.                     |
| `'catppuccin-latte'` | **Light** (Low) | Warm, cozy light mode with soft colors.          |

#### <a id="4-3-2"></a>Examples

**1. Minimal defaults with custom branding (recommended):**
Set only the colors you care about; everything else stays maximally readable.

```typescript
// Only customize error and warn
const myLogger = createColorino({ 
  error: '#ff007b',
  warn: '#ffa500'
})

// Detected dark terminal:
// - error: #ff007b (your custom red)
// - warn: #ffa500 (your custom orange)  
// - info, log, debug, trace: #ffffff (white - safe on dark)

// Detected light terminal:
// - error: #ff007b (your custom red)
// - warn: #ffa500 (your custom orange)
// - info, log, debug, trace: #000000 (black - safe on light)
```

**2. Force a specific mode (uses defaults):**
Useful for CI/CD or environments where detection fails.

```typescript
// Forces dark mode using the default minimal palette (minimal-dark)
const darkLogger = createColorino({}, { theme: 'dark' })
```

**3. Use a specific preset:**
Instant branding with zero configuration.

```typescript
// Forces the Dracula palette
const draculaLogger = createColorino({}, { theme: 'dracula' })
```

**4. Customize a preset:**
Overlay your own colors on top of a built-in theme.

```typescript
// Use GitHub Light but with a custom error color
const myLogger = createColorino(
  { error: '#ff007b' }, 
  { theme: 'github-light' }
)
```

> **Tip:**
> Forcing `'dark'` or `'light'` bypasses automatic theming, ensuring predictable colors in environments with unknown or unsupported theme detection (like some CI pipelines, dumb terminals, or minimal browsers).

### <a id="4-4"></a>Customization

Use your brand colors by passing a partial palette to the `createColorino` factory. Any log levels you don't specify will use the detected **minimal** defaults (`minimal-dark` / `minimal-light`) unless you explicitly select a theme preset.

```typescript
import { createColorino } from 'colorino'

// Custom error color; others use theme defaults
const myLogger = createColorino({ error: '#ff007b' })

myLogger.error('Oh no!') // Uses your custom color
myLogger.info('Still styled by theme.') // Uses the default theme color
```

### <a id="4-5"></a>Supported Environment Variables

Colorino auto-detects your environment and color support, but you can override behavior using these standard environment variables (compatible with Chalk):

| Variable         | Effect                                            | Example                  |
|------------------|---------------------------------------------------|--------------------------|
| `NO_COLOR`       | Forces *no color* output                          | `NO_COLOR=1 node app.js` |
| `FORCE_COLOR`    | Forces color (`1`=ANSI, `2`=256, `3`=truecolor)   | `FORCE_COLOR=3 node app.js` |
| `CLICOLOR`       | `"0"` disables color                              | `CLICOLOR=0 node app.js` |
| `CLICOLOR_FORCE` | Non-`"0"` value enables color even if not a TTY   | `CLICOLOR_FORCE=1 node app.js` |
| `TERM`           | Terminal type, can increase/decrease support      | `TERM=xterm-256color`    |
| `COLORTERM`      | `'truecolor'` or `'24bit'` enables truecolor      | `COLORTERM=truecolor`    |
| `WT_SESSION`     | Detected for Windows Terminal (enables color)     |                          |
| `CI`             | Many CI platforms default to *no color*           | `CI=1 node app.js`       |

## <a id="5"></a>Colorino vs. Chalk

| Feature                  | 🎨 **Colorino**            | 🖍️ **Chalk**    |
|--------------------------|----------------------------|-----------------|
| Out-of-box logs          | ✔ themed, all log levels   | ✘ string styling|
| Zero-config              | ✔                          | ✘ manual, per-use|
| Node + browser           | ✔                          | ✘ (Node only)   |
| CSS console logs         | ✔                          | ✘               |
| Extensible / Composable  | ✔ (via factory)            | ✘               |

## <a id="6"></a>API Reference

The `colorino` package exports two main items:

### <a id="6-1"></a>1. `colorino` (default instance)

A pre-configured, zero-setup logger instance. Just import and use.

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.debug(...args)`
- `.trace(...args)`

### <a id="6-2"></a>2. `createColorino(palette?, options?)` (factory)

A factory function to create your own customized logger instances.

- `palette` (`Partial<Palette>`): An object to override default colors for specific log levels (e.g., `{ error: '#ff007b' }`).
- `options` (`ColorinoOptions`): An object to control behavior:
  - `disableWarnings: boolean` (default `false`): Suppress warnings on environments with no color support.
  - `theme: 'dark' | 'light'` (default `auto`): Force a specific theme instead of auto-detecting.

## <a id="7"></a>Extending Colorino

Example: Add a `fatal()` logger for critical errors.

Since colorino uses a factory pattern, extend it by creating your own factory that composes the base logger with additional methods:

```typescript
import { createColorino, type ColorinoOptions, type Palette } from 'colorino'

// Create a factory for your custom logger
export function createMyLogger(palette?: Partial<Palette>, options?: ColorinoOptions) {
  // Get the base logger instance
  const baseLogger = createColorino(palette, options)

  // Define your custom method
  function fatal(...args: unknown[]): void {
    // Reuse the base logger's error method
    baseLogger.error(...args)

    // Add your custom behavior
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1)
    }
  }

  // Return a new object with all base methods + your custom ones
  // This preserves type safety and the original API
  return {
    ...baseLogger,
    fatal,
  }
}
```

Usage:

```typescript
const logger = createMyLogger({ error: '#d92626' })

logger.info('Starting!')
logger.fatal('Missing config: Exiting')
```

### <a id="7-1"></a>Why This Pattern?

- **Composition > Inheritance**: No fragile base class problems
- **Type Safe**: TypeScript infers the return type correctly
- **Future Proof**: Works even if colorino's internal implementation changes
- **Clean**: No messing with `super()` or constructor parameters
- **Composable**: You can layer multiple extensions

## <a id="8"></a>License

[MIT](LICENSE.md)
