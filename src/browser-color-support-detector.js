import { ColorLevel } from './enums.js';
export class BrowserColorSupportDetector {
    _window;
    _navigator;
    _overrideTheme;
    constructor(_window, _navigator, _overrideTheme) {
        this._window = _window;
        this._navigator = _navigator;
        this._overrideTheme = _overrideTheme;
    }
    isBrowserEnv() {
        return !!this._window && !!this._navigator?.userAgent;
    }
    getColorLevel() {
        return ColorLevel.TRUECOLOR;
    }
    getTheme() {
        if (this._overrideTheme) {
            return this._overrideTheme;
        }
        if (typeof this._window.matchMedia !== 'function') {
            return 'unknown';
        }
        const isDarkTheme = this._window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkTheme)
            return 'dark';
        const isLightTheme = '(prefers-color-scheme: light)';
        if (this._window.matchMedia(isLightTheme).matches) {
            return 'light';
        }
        return 'unknown';
    }
}
//# sourceMappingURL=browser-color-support-detector.js.map