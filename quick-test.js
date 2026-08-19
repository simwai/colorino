import { createColorino, log } from './dist/node.mjs'

const colorino = createColorino()

console.log('\n--- Gradient Tests ---')
console.log(colorino.gradient('█'.repeat(50), '#00ff00', '#ff00ff'))
console.log(colorino.gradient('COLORINO', '#ffd700', '#ff1493'))

// Standalone gradient
colorino.log(colorino.gradient('Hello!', '#ff0000', '#0000ff'))

// Gradient with additional text
colorino.log(colorino.gradient('Hello!', '#ff0000', '#0000ff'), 'second string')

// Mixed with other text
const title = colorino.gradient('COLORINO', '#ffd700', '#ff1493')
colorino.info('Welcome to', title, '– the smart logger')

// Combine multiple effects
const badge = colorino.colorize('v2.0', '#00ff00')
const brand = colorino.gradient('Colorino', '#ff6b6b', '#4ecdc4')
colorino.log(brand, badge, 'shipped!')

console.log('\n--- Trace Tests: Default (hide colorino, show node) ---')
colorino.trace('test', new Error('TestoErroro'))
colorino.trace('test', new Error('TestoErroro').stack)
colorino.trace('test', { testo: 'objecto' })

console.log('\n--- Trace Tests: Hide both ---')
const colorino2 = createColorino(
  {},
  {
    areNodeFramesVisible: false,
    areColorinoFramesVisible: false,
  }
)

colorino2.trace('test', new Error('TestoErroro'))
colorino2.trace('test', new Error('TestoErroro').stack)
colorino2.trace('test', { testo: 'objecto' })

console.log('\n--- Trace Tests: Hide node, show colorino ---')
const colorino3 = createColorino(
  {},
  {
    areNodeFramesVisible: false,
    areColorinoFramesVisible: true,
  }
)

colorino3.trace('test', new Error('TestoErroro'))
colorino3.trace('test', new Error('TestoErroro').stack)
colorino3.trace('test', { testo: 'objecto' })

console.log('\n--- Trace Tests: Show both ---')
const colorino4 = createColorino(
  {},
  {
    areNodeFramesVisible: true,
    areColorinoFramesVisible: true,
  }
)

colorino4.trace('test', new Error('TestoErroro'))
colorino4.trace('test', new Error('TestoErroro').stack)
colorino4.trace('test', { testo: 'objecto' })

console.log('\n--- Enhanced Logging Tests ---')
const enhancedLogger = createColorino(
  {},
  {
    fileLogging: {
      path: './tmp/colorino-manual.log',
      maxBytes: 4096,
      maxFiles: 2,
      stripAnsi: true,
      timezone: 'UTC',
    },
  }
)

const details = { password: 'do-not-write-me', count: 1n }
details.self = details
enhancedLogger.info('Readable details:', details)

class ManualService {
  load(value) {
    return value.toUpperCase()
  }
}

ManualService.prototype.load = log(enhancedLogger, { logLevel: 'info' })(
  ManualService.prototype.load,
  { name: 'load' }
)

const service = new ManualService()
enhancedLogger.log('Decorated result:', service.load('colorino'))
console.log('File output: ./tmp/colorino-manual.log')

console.log('\n--- Log Level Threshold Tests ---')
const thresholdLogger = createColorino({}, { level: 'warn' })

thresholdLogger.trace('hidden below warn') // below threshold
thresholdLogger.debug('hidden below warn') // below threshold
thresholdLogger.log('hidden below warn') // below threshold
thresholdLogger.info('hidden below warn') // below threshold
thresholdLogger.warn('visible at threshold') // at threshold
thresholdLogger.error('visible at threshold') // at threshold

console.log('Current threshold:', thresholdLogger.getLevel())
thresholdLogger.setLevel('info')
console.log('New threshold:', thresholdLogger.getLevel())
thresholdLogger.info('now visible after setLevel') // at threshold
thresholdLogger.log('still hidden') // below threshold
