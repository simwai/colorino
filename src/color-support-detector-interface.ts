import type { ColorLevel } from './enums.js'

export interface ColorSupportDetectorInterface {
  getColorLevel(): ColorLevel
}