import { catppuccinMochaPalette, catppuccinLattePalette, draculaPalette, githubLightPalette, } from './palettes.js';
export const themePalettes = {
    'catppuccin-mocha': catppuccinMochaPalette,
    'catppuccin-latte': catppuccinLattePalette,
    dracula: draculaPalette,
    'github-light': githubLightPalette,
};
export const defaultDarkTheme = 'dracula';
export const defaultLightTheme = 'github-light';
export function isThemeName(theme) {
    return theme in themePalettes;
}
//# sourceMappingURL=theme.js.map