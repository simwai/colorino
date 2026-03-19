const defaultPalette = {
    log: '#ffffff',
    info: '#00ffff',
    warn: '#ffff00',
    error: '#ff0000',
    trace: '#bd93f9',
    debug: '#f1fa8c',
};
export function createTestPalette(overrides = {}) {
    return { ...defaultPalette, ...overrides };
}
//# sourceMappingURL=palette.js.map