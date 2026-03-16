# Colorino 🎨

A super simple, context-aware colorized logger for both **Node.js** and the **browser**.

Colorino automatically detects your terminal's color support and theme (dark/light), providing a beautiful, zero-config logging experience with minimal dependencies.

## Features

- 🌈 **Full Color Support**: Auto-detects and supports ANSI, ANSI-256, and Truecolor.
- 🌓 **Theme-Aware**: Detects your terminal's background (dark vs. light) via OSC 11 and adjusts its palette automatically.
- 📦 **Zero-Config**: Built-in professional themes like Dracula and Catppuccin.
- 🌐 **Isomorphic**: Works identically in Node.js and modern browsers.
- 🔍 **Call-site Metadata**: Automatically attach filename, line number, and function name to your logs.
- 📁 **File Logging**: Node-only support for writing logs to files with automatic directory creation.
- ⚙️ **Filtering**: Powerful log-level filtering based on min-level, allow-lists, and deny-lists.
- 🛡️ **Fail-fast**: Runtime configuration validation to catch errors early.

## Installation

```bash
npm install colorino
```

## Log Levels

Colorino follows the **Bunyan/Pino** standard (aligned with RFC 5424) for log levels:

| Level | Priority | Description |
| :--- | :--- | :--- |
| `trace` | 10 | Extremely detailed information, usually for debugging. |
| `debug` | 20 | Detailed information for developer use. |
| `info` | 30 | Regular operational messages. |
| `log` | 30 | Alias for info (compatibility). |
| `warn` | 40 | Warnings that don't stop the application. |
| `error` | 50 | Serious issues that require attention. |

## Usage

### Simple Logging

```typescript
import { colorino } from 'colorino'

colorino.info('Hello World!')
colorino.warn('Something looks fishy...')
colorino.error('Oops, an error occurred.')
```

### Configuration

Create a custom instance with `createColorino(palette?, options?)`.

```typescript
import { createColorino } from 'colorino'

const logger = createColorino({}, {
  theme: 'dracula',
  logLevel: {
    min: 'debug'
  },
  metadata: {
    callSite: {
      isEnabled: true,
      isCallerFunctionVisible: true,
      position: 'prefix'
    }
  },
  fileLogging: {
    isEnabled: true,
    path: './logs/app.log',
    isAppendMode: true
  }
})

logger.debug('This is a debug message')
```

#### `ColorinoOptions`

| Option | Type | Description |
| :--- | :--- | :--- |
| `theme` | `string` | `auto`, `dark`, `light`, `dracula`, `catppuccin-mocha`, etc. |
| `maxDepth` | `number` | Max depth for object stringification (default 5). |
| `logLevel` | `object` | `min`, `allow[]`, `deny[]`. |
| `metadata` | `object` | `callSite` and `timestamp` (reserved) configuration. |
| `fileLogging` | `object` | Node-only file output configuration. |

### Metadata Tags (Call-site)

Colorino can capture where the log call originated. This is enabled by default in Node and disabled by default in browsers.

```typescript
const logger = createColorino({}, {
  metadata: {
    callSite: {
      isEnabled: true,
      isCallerPathRelative: true,
      isCallerFunctionVisible: false
    }
  }
})

// Output: [src/index.ts:10:5] Hello!
logger.info('Hello!')
```

### File Logging (Node)

Write your logs to a file automatically. Colorino handles directory creation and uses an internal non-blocking queue.

```typescript
const logger = createColorino({}, {
  fileLogging: {
    isEnabled: true,
    path: 'logs/combined.log',
    minLevel: 'info'
  }
})
```

## API Reference

### `colorino` (default instance)
- `.trace(...args)`
- `.debug(...args)`
- `.info(...args)`
- `.log(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.colorize(text, hex)`: Manually colorize a string.
- `.gradient(text, start, end)`: Apply a linear gradient.
- `.css(text, style)`: (Browser only) Apply CSS styles.

### `createColorino(userPalette?, options?)`
Returns a new logger instance. Throws `ColorinoConfigError` for invalid options.

## License

MIT
