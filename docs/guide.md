# Getting Started

Colorino is a lightweight, zero-dependency colorized logger designed for both Node.js and Browser environments. It automatically detects terminal color support (ANSI 16, 256, RGB) and themes the output for maximum readability.

## Installation

```bash
npm install colorino
```

## Quick Start

Import and use the pre-configured `colorino` instance:

```ts
import { colorino } from 'colorino'

colorino.log('Basic log message')
colorino.info('Informational message')
colorino.warn('Warning message')
colorino.error('Error message')
```

## Features

- **Theming**: Automatically switches between Dark and Light themes based on terminal background detection.
- **Gradient Text**: Create smooth color transitions across text.
- **CSS Formatting**: Full CSS support in browser DevTools.
- **Zero Configuration**: Works out of the box with sensible defaults.
