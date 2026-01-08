import { NodeColorSupportDetector } from '../../node-color-support-detector.js'

const detector = new NodeColorSupportDetector()
const theme = detector.getTheme()

process.stdout.write(theme)
process.exit(0)
