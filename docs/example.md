# Examples

Here are some common usage examples of Colorino.

## Basic Usage

```ts
import { colorino } from 'colorino'

colorino.log('Basic log')
colorino.info('Information')
colorino.warn('Warning')
colorino.error('Error')
```

## Custom Logger Factory

Create a customized logger instance with your own brand colors:

```ts
import { createColorino } from 'colorino'

const customLogger = createColorino({
  error: '#ff007b',
  warn: '#ffa500',
})

customLogger.error('This is a custom error color!')
```

## Gradients

Smooth color transitions:

```ts
import { colorino } from 'colorino'

const rainbow = colorino.gradient('Hello Gradient!', '#ff0000', '#0000ff')
colorino.log(rainbow)
```
