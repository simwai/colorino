import { defaultLightTheme, defaultDarkTheme, isThemeName } from './theme.js';
export function determineBaseTheme(themeOpt, detectedBrowserTheme) {
    let baseThemeName;
    if (isThemeName(themeOpt)) {
        baseThemeName = themeOpt;
    }
    else if (themeOpt === 'light') {
        baseThemeName = defaultLightTheme;
    }
    else if (themeOpt === 'dark') {
        baseThemeName = defaultDarkTheme;
    }
    else {
        // Fallback to 'auto' detection
        baseThemeName =
            detectedBrowserTheme === 'light' ? defaultLightTheme : defaultDarkTheme;
    }
    return baseThemeName;
}
//# sourceMappingURL=determine-base-theme.js.map