import { colorino as colorinoInstance, createColorino, themePalettes, } from './browser.js';
// Attach extras onto the instance so the UMD global stays `colorino.info(...)`
const colorinoUmdGlobal = colorinoInstance;
colorinoUmdGlobal.createColorino = createColorino;
colorinoUmdGlobal.themePalettes = themePalettes;
export default colorinoUmdGlobal;
//# sourceMappingURL=browser-umd.js.map