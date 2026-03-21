# Dynamic Examples

This page demonstrates how Colorino works in different scenarios.

## Simple Example

```ts
import { colorino } from 'colorino'

colorino.info('Dynamic loading works!')
```

## Advanced Example

Create a context-aware logger:

```ts
import { createColorino } from 'colorino'

const logger = createColorino({ info: '#8be9fd' })
logger.info('Custom colors')
```
