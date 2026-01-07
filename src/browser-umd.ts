import {
  colorino as colorinoInstance,
  createColorino,
  themePalettes,
} from './browser.js'

type ColorinoUmdGlobal = typeof colorinoInstance & {
  createColorino: typeof createColorino
  themePalettes: typeof themePalettes
}

// Attach extras onto the instance so the UMD global stays `colorino.info(...)`
const colorinoUmdGlobal = colorinoInstance as ColorinoUmdGlobal
colorinoUmdGlobal.createColorino = createColorino
colorinoUmdGlobal.themePalettes = themePalettes

export default colorinoUmdGlobal
