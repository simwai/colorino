import { defaultLightTheme, defaultDarkTheme, isThemeName } from './theme.js'
import { type ThemeName } from './types.js'

export function determineBaseTheme(
  themeOpt: string,
  detectedBrowserTheme: string
) {
  let baseThemeName: ThemeName

  if (isThemeName(themeOpt)) {
    baseThemeName = themeOpt
  } else if (themeOpt === 'light') {
    baseThemeName = defaultLightTheme
  } else if (themeOpt === 'dark') {
    baseThemeName = defaultDarkTheme
  } else {
    // Fallback to 'auto' detection
    baseThemeName =
      detectedBrowserTheme === 'light' ? defaultLightTheme : defaultDarkTheme
  }
  return baseThemeName
}