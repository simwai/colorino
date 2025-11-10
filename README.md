Of course. A comprehensive "Quick Start" section is crucial for showing off the full capabilities of the library immediately.

Here is the updated `README.md` with the "Quick Start" section expanded to include examples of all supported log methods.

***

# 🎨 Colorino

**The zero-configuration, context-aware `console` logger for Node.js and the Browser.**

*Colorino automatically adapts its default palette to your terminal's theme.*

***

## Table of Contents

- [Why Colorino?](#why-colorino)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
  - [Quick Start](#quick-start)
  - [Customization](#customization)
- [Colorino vs. Chalk](#colorino-vs-chalk)
- [API Reference](#-api-reference)
- [Extend Colorino](#-extend-colorino)
- [Contributing](#-contributing)
- [License](#-license)

## Why Colorino?

Plain `console.log` is boring and lacks context. Libraries like `chalk` are powerful but require you to manually style every single log line, leading to boilerplate and inconsistency.

**Colorino is different.** It's a "batteries-included" logging facade that provides beautifully themed, context-aware logs with **zero configuration**. It uses the same familiar `console.log` API, so you already know how to use it.

Drop it in, and your logs are instantly upgraded.

## ✨ Features

- **🎨 Automatic Theming:** Intelligently detects your terminal's background (dark/light) and applies a beautiful, readable default color palette.
- **familiar API:** If you know how to use `console.log`, `console.warn`, and `console.error`, you know how to use Colorino. No learning curve.
- **🚀 Cross-Environment:** Works seamlessly in both **Node.js** and the **Browser**.
- **🔧 Effortless Customization:** Easily override default colors for any log level without losing the benefits of the automatic theme.
- **🛡️ Robust & Safe:** Gracefully handles invalid inputs and environment quirks without crashing your application.
- **feather-light:** Minimal dependencies and a tiny footprint.

## 📦 Installation

```sh
npm install colorino
```

```sh
yarn add colorino
```

## 🚀 Usage

### Quick Start

Import `colorino` and use it just like you would use the `console` object. It supports all standard log levels, each with a distinct, theme-aware color.

```typescript
import { colorino } from 'colorino';

// Log messages by severity
colorino.error('This is a critical error!');
colorino.warn('This is a warning message.');
colorino.info('This is an informational message.');
colorino.log('This is a standard log message.');

// Use debug for detailed object inspection
const user = { id: 1, name: 'Alex', role: 'admin' };
colorino.debug('Debugging user object:', user);

// Use trace for fine-grained execution flow
colorino.trace('Entering the main application loop...');
```

### Customization

Want to use your own brand colors? Simply create a new `Colorino` instance and provide a partial palette. Any colors you don't provide will automatically fall back to the detected theme's defaults.

```typescript
import { Colorino } from 'colorino';

// Create a logger with a custom error color.
// log, info, warn, etc., will still use the smart defaults.
const myLogger = new Colorino({
  error: '#ff007b', // Your custom hot pink error color
});

myLogger.error('A critical failure occurred!');
myLogger.warn('This warning uses the default theme color.');
```

## Colorino vs. Chalk

While both libraries deal with colors, they solve different problems.

| Feature               | **🎨 Colorino**                                  | **🖍️ Chalk**                                      |
| --------------------- | ------------------------------------------------ | -------------------------------------------------- |
| **Primary Purpose**   | A themed logging facade                          | A string styling toolkit                           |
| **Analogy**           | A set of pre-designed, coordinated markers       | A full box of crayons                              |
| **Usage**             | `colorino.info('Ready to go!')`                  | `console.log(chalk.blue('Ready to go!'))`          |
| **Configuration**     | Zero-config, with optional overrides             | Requires manual styling for every use              |
| **Best For**          | Quickly adding consistent, beautiful logs        | Granular control over styling individual strings   |

## 📖 API Reference

### `colorino` (default export)

A pre-configured, singleton instance of the `Colorino` class. Ready for immediate use.

- `.log(...args: unknown[]): void`
- `.info(...args: unknown[]): void`
- `.warn(...args: unknown[]): void`
- `.error(...args: unknown[]): void`
- `.debug(...args: unknown[]): void`
- `.trace(...args: unknown[]): void`

### `new Colorino(palette?, options?)`

Creates a new, customizable `Colorino` instance.

- **`palette`** (`Partial<Palette>`): An object where you can override the default colors for any log level (`log`, `info`, `warn`, `error`, `debug`, `trace`).
- **`options`** (`{ disableWarnings?: boolean }`): Set `disableWarnings` to `true` to suppress warnings, such as when color support cannot be detected.

## ✍️ Extend Colorino

Because `Colorino` is a standard TypeScript class, you can easily extend it to create custom loggers with application-specific behavior. A common use case is creating a `fatal` logger that logs a critical error and then gracefully exits the application.

This pattern allows you to keep your application logic clean while reusing all of `Colorino`'s theming and formatting capabilities.

### Example: Creating a `fatal` Logger

Here’s how you can create `MyLogger` with a `.fatal()` method.

**`MyLogger.ts`**

```typescript
import { Colorino, type Palette } from 'colorino';

export class MyLogger extends Colorino {
  constructor(palette?: Partial<Palette>, options?: { disableWarnings?: boolean }) {
    // Pass the configuration up to the parent Colorino class
    super(palette, options);
  }

  /**
   * Logs a message using the 'error' style and then terminates the process.
   */
  public fatal(...args: unknown[]): void {
    // 1. Log the message using the parent's .error() method for consistent styling
    super.error(...args);

    // 2. Exit the application with a failure code
    process.exit(1);
  }
}
```

**Usage**

```typescript
import { MyLogger } from './MyLogger';

// You can still customize the palette as usual
const logger = new MyLogger({
  error: '#d92626' // A custom, extra-loud error color
});

logger.info('Application started successfully.');

if (!process.env.API_KEY) {
  // This will log the error message in your custom red and then exit
  logger.fatal('Critical error: API_KEY is not defined. Shutting down.');
}
```

## 🤝 Contributing

Contributions are welcome! Whether it's a bug report, a feature request, or a pull request, please feel free to get involved.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-cool-idea`).
3. Commit your changes (`git commit -am 'Add some cool idea'`).
4. Push to the branch (`git push origin feature/my-cool-idea`).
5. Open a Pull Request.

Please make sure to run tests before submitting a PR: `npm test`.

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
