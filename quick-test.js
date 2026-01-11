import { createColorino } from './dist/node.mjs'

const colorino = createColorino()

console.log('\n--- ANSI Gradient Test ---')
console.log(colorino.gradient('Hello Gradient World!', '#ff0000', '#0000ff'))
console.log(colorino.gradient('█'.repeat(50), '#00ff00', '#ff00ff'))
console.log(colorino.gradient('COLORINO', '#ffd700', '#ff1493'))

// Standalone
colorino.log(colorino.gradient('Hello!', '#ff0000', '#0000ff'))

// Mixed with other text
const title = colorino.gradient('COLORINO', '#ffd700', '#ff1493')
colorino.info('Welcome to', title, '– the smart logger')

// Combine multiple effects
const badge = colorino.colorize('v2.0', '#00ff00')
const brand = colorino.gradient('Colorino', '#ff6b6b', '#4ecdc4')
colorino.log(brand, badge, 'shipped!')

// Trace
colorino.trace('test', new Error('TestoErroro'))
colorino.trace('test', new Error('TestoErroro').stack)
colorino.trace('test', { testo: 'objecto' })
