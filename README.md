# 🎨 Colorino

**The zero-configuration, context-aware `console` logger for Node.js and the browser.**

Colorino automatically adapts its palette to your terminal or browser DevTools theme.

***

## Table of Contents

- [Why use Colorino?](#why-use-colorino)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Quick Start](#quick-start)
  - [Creating a Custom Logger](#creating-a-custom-logger)
  - [Options & Theme Overrides](#options--theme-overrides)
  - [Customization](#customization)
  - [Supported Environment Variables](#supported-environment-variables)
- [Colorino vs. Chalk](#colorino-vs-chalk)
- [API Reference](#api-reference)
- [Extending Colorino](#extending-colorino)
- [Contributing](#contributing)
- [License](#license)

***

## Why use Colorino?

Plain `console.log` is colorless and inconsistent. Libraries like `chalk` let you style strings, but you have to decorate every message and manually manage color choices.

Colorino is different: it’s a "batteries-included" logging facade with beautiful, theme-aware colors and a familiar API—no learning curve, no configuration. Instantly upgrade your logs everywhere.

***

## Features

- 🎨 **Smart Theming:** Automatically detects *dark/light* mode and uses a coordinated color palette.
- 🤝 **Familiar API:** If you know `console.log`, you already know Colorino: all standard log levels are supported.
- 🔀 **Environment-Aware:** Works in **Node.js** (ANSI color and truecolor) and all major **Browsers** (CSS styles).
- ⚡️ **Fast, Lightweight:** Minimal dependencies, works great in modern frameworks and CLIs.
- 🔒 **Robust:** Handles bad inputs and weird environments safely.
- 🛠️ **Customizable:** Override individual log colors for your own branding.

***

## Installation

```sh
npm install colorino
# or
yarn add colorino
```

***

## Usage

### Quick Start

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

***

### Creating a Custom Logger

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

***

### Options & Theme Overrides

Both `createColorino(palette?, options?)` and `new Colorino(palette?, options?)` accept:

| Option             | Type                  | Default     | Description                                                                    |
|--------------------|----------------------|-------------|--------------------------------------------------------------------------------|
| `disableWarnings`  | `boolean`            | `false`     | Suppress warnings when color support can't be detected or is disabled           |
| `theme`            | `'dark' \| 'light' \| 'unknown'` | *(auto)*      | Override auto-theme detection: force `'dark'` or `'light'` for palette selection |

#### Example: Forcing a theme

If the auto-contrast and theme detection doesn't work (e.g., in some CI/CD, headless, or basic terminals), **force the color scheme**:

```typescript
import { createColorino } from 'colorino'

// Force dark palette regardless of environment
const forcedDarkLogger = createColorino({}, { theme: 'dark' })

forcedDarkLogger.info('This will always use dark-friendly colors.')
```

> **Tip:**  
> Forcing `'dark'` or `'light'` bypasses automatic theming, ensuring predictable colors in environments with unknown or unsupported theme detection (like some CI pipelines, dumb terminals, or minimal browsers).

***

### Customization

Use your brand colors or tweak log levels as desired. Unspecified colors use the smart palette.

```typescript
import { Colorino } from 'colorino'

// Custom error color; others use theme defaults
const myLogger = new Colorino({ error: '#ff007b' })

myLogger.error('Oh no!')
myLogger.info('Still styled by theme.')
```

***

### Supported Environment Variables

Colorino auto-detects your environment and color support, but you can override behavior using these standard environment variables (compatible with Chalk):

| Variable         | Effect                                             | Example                  |
|------------------|---------------------------------------------------|--------------------------|
| `NO_COLOR`       | Forces *no color* output                          | `NO_COLOR=1 node app.js` |
| `FORCE_COLOR`    | Forces color (`1`=ANSI, `2`=256, `3`=truecolor)   | `FORCE_COLOR=3 node app.js` |
| `CLICOLOR`       | `"0"` disables color                              | `CLICOLOR=0 node app.js` |
| `CLICOLOR_FORCE` | Non-`"0"` value enables color even if not a TTY   | `CLICOLOR_FORCE=1 node app.js` |
| `TERM`           | Terminal type, can increase/decrease support      | `TERM=xterm-256color`    |
| `COLORTERM`      | `'truecolor'` or `'24bit'` enables truecolor      | `COLORTERM=truecolor`    |
| `WT_SESSION`     | Detected for Windows Terminal (enables color)     |                          |
| `CI`             | Many CI platforms default to *no color*           | `CI=1 node app.js`       |

***

## Colorino vs. Chalk

| Feature           | 🎨 **Colorino**                  | 🖍️ **Chalk**     |
|-------------------|----------------------------------|------------------|
| Out-of-box logs   | ✔ themed, all log levels         | ✘ string styling |
| Zero-config       | ✔                                | ✘ manual, per-use|
| Node + browser    | ✔                                | ✘ (Node only)    |
| CSS console logs  | ✔                                | ✘                |
| Extendable class  | ✔                                | ✘                |

***

## API Reference

### colorino (default export)

Preconfigured logger.

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.debug(...args)`
- `.trace(...args)`

### new Colorino(palette?, options?)

- `palette` (`Partial<Palette>`): Override colors for log types.
- `options` (`{ disableWarnings?: boolean; theme?: 'dark' | 'light' | 'unknown' }`): Control warnings and explicit theme.

***

## Extending Colorino

Example: Add a `fatal()` logger for critical errors.

```typescript
import { Colorino, type Palette } from 'colorino'

export class MyLogger extends Colorino {
  constructor(palette?: Partial<Palette>, options?: { disableWarnings?: boolean }) {
    super(palette, options)
  }
  public fatal(...args: unknown[]): void {
    super.error(...args)
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1)
    }
  }
}
```

Usage:

```typescript
const logger = new MyLogger({ error: '#d92626' })

logger.info('Starting!')
logger.fatal('Missing config: Exiting')
```

***

## Contributing

PRs and issues welcome!

1. Fork the repo.
2. Make a branch (`git checkout -b feat/my-feature`)
3. Add your change, with tests.
4. Run `npm test` to ensure all tests pass in both Node and browser.
5. Open a Pull Request.

***

## License

MIT

***

> *Note:* When running tests, browser output is simulated. Visual styling only appears in real browsers/devtools, but Colorino always routes logs correctly for every environment.
