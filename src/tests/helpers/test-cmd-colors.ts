import { NodeColorSupportDetector } from '../../node-color-support-detector.js'

const detector = new NodeColorSupportDetector(true, process)

console.log('ColorLevel:', detector.getColorLevel())
console.log('Theme:', detector.getTheme())
console.log('isTTY:', process.stdout.isTTY)

process.exit(0)
