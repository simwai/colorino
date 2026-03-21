# API Reference

The `colorino` package exports two main items:

## 1. `colorino` (default instance)

A pre-configured, zero-setup logger instance. Just import and use.

- `.log(...args)`
- `.info(...args)`
- `.warn(...args)`
- `.error(...args)`
- `.debug(...args)`
- `.trace(...args)`

## 2. `createColorino(palette?, options?)` (factory)

A factory function to create your own customized logger instances.

### Parameters

- `palette` (`Partial<Palette>`): An object to override default colors for specific log levels (e.g., `{ error: '#ff007b' }`).
- `options` (`ColorinoOptions`): An object to control behavior:
  - `theme: 'dark' | 'light'` (default `auto`): Force a specific theme instead of auto-detecting.

## Methods

### `.colorize(text, hex)`

Apply a specific color to a segment of text.

### `.gradient(text, startHex, endHex)`

Create a smooth color transition across text.

### `.css(text, style)` (Browser only)

Apply arbitrary CSS to a single segment in DevTools.
