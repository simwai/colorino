import { ColorinoBrowser } from './colorino-browser.js';
import { BrowserColorSupportDetector } from './browser-color-support-detector.js';
import { InputValidator } from './input-validator.js';
import { themePalettes } from './theme.js';
import { determineBaseTheme } from './determine-base-theme.js';
/**
 * Creates a new Colorino logger instance for the browser.
 * @param userPalette - Optional custom hex colors for log levels.
 * @param options - Configuration for theme, filtering, and metadata.
 */
export function createColorino(userPalette = {}, options = {}) {
    const validator = new InputValidator();
    const themeOption = options.theme ?? 'auto';
    const detectorTheme = (themeOption === 'dark' || themeOption === 'light') ? themeOption : undefined;
    const detector = new BrowserColorSupportDetector(window, navigator, detectorTheme);
    const baseTheme = determineBaseTheme(themeOption, detector.getTheme());
    const finalPalette = { ...themePalettes[baseTheme], ...userPalette };
    const colorLevel = detector.isBrowserEnv() ? (detector.getColorLevel() ?? 'UnknownEnv') : 'UnknownEnv';
    return new ColorinoBrowser(finalPalette, userPalette, validator, colorLevel, options);
}
export { themePalettes };
/** Default Colorino logger instance for the browser. */
export const colorino = createColorino();
//# sourceMappingURL=browser.js.map