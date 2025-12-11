import { NodeColorSupportDetector } from '../../node-color-support-detector.js'

const detector = new NodeColorSupportDetector(process)
const theme = detector.getTheme()

// Just output the theme
process.stdout.write(theme)
process.exit(0)
