import { ColorLevel } from './enums.js';
import { getTerminalThemeSync } from './osc-theme-sync.js';
export class NodeColorSupportDetector {
    _process;
    _overrideTheme;
    _isOsc11Enabled;
    _envForceColor;
    _envTerm;
    _envColorTerm;
    _envNoColor;
    _envCliColor;
    _envCliColorForce;
    _envWtSession;
    _envTermProgram;
    _envVteVersion;
    _isTTY;
    _theme;
    constructor(_process, _overrideTheme, _isOsc11Enabled = true) {
        this._process = _process;
        this._overrideTheme = _overrideTheme;
        this._isOsc11Enabled = _isOsc11Enabled;
        if (this._overrideTheme !== undefined) {
            this._theme = this._overrideTheme;
            return;
        }
        if (!this.isNodeEnv()) {
            this._theme = 'unknown';
            return;
        }
        this._isTTY = !!_process.stdout.isTTY;
        const processEnv = _process.env;
        this._envForceColor = processEnv['FORCE_COLOR'];
        this._envNoColor = processEnv['NO_COLOR'];
        this._envTerm = processEnv['TERM'];
        this._envColorTerm = processEnv['COLORTERM'];
        this._envCliColor = processEnv['CLICOLOR'];
        this._envCliColorForce = processEnv['CLICOLOR_FORCE'];
        this._envWtSession = processEnv['WT_SESSION'];
        this._envTermProgram = processEnv['TERM_PROGRAM'];
        this._envVteVersion = processEnv['VTE_VERSION'];
        if (!this._isTTY) {
            this._theme = 'unknown';
            return;
        }
        this._theme =
            this._isOsc11Enabled && this._supportsOsc11()
                ? getTerminalThemeSync()
                : 'unknown';
    }
    isNodeEnv() {
        return typeof this._process !== 'undefined';
    }
    getTheme() {
        return this._theme;
    }
    getColorLevel() {
        if (this._envNoColor !== undefined && this._envNoColor !== '') {
            return ColorLevel.NO_COLOR;
        }
        if (this._envForceColor !== undefined) {
            if (this._envForceColor === '0' || this._envForceColor === 'false') {
                return ColorLevel.NO_COLOR;
            }
            if (this._envForceColor === '1' || this._envForceColor === 'true') {
                return ColorLevel.ANSI;
            }
            const level = parseInt(this._envForceColor, 10);
            if (level >= 0 && level <= 3) {
                return level;
            }
            return ColorLevel.ANSI;
        }
        const isForced = this._envCliColorForce !== undefined && this._envCliColorForce !== '0';
        if (!this._isTTY && !isForced) {
            return ColorLevel.NO_COLOR;
        }
        if (this._envTerm === 'dumb') {
            return ColorLevel.NO_COLOR;
        }
        if (this._envColorTerm === 'truecolor' || this._envColorTerm === '24bit') {
            return ColorLevel.TRUECOLOR;
        }
        if (this._envWtSession !== undefined) {
            return ColorLevel.TRUECOLOR;
        }
        if (this._envTerm) {
            if (/^xterm-kitty$/.test(this._envTerm) ||
                /^xterm-ghostty$/.test(this._envTerm) ||
                /^wezterm$/.test(this._envTerm) ||
                this._envTerm.endsWith('-truecolor')) {
                return ColorLevel.TRUECOLOR;
            }
            if (/-256(color)?$/i.test(this._envTerm)) {
                return ColorLevel.ANSI256;
            }
            if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(this._envTerm)) {
                return ColorLevel.ANSI;
            }
        }
        if (this._envColorTerm) {
            return ColorLevel.ANSI;
        }
        if (this._envCliColor !== undefined && this._envCliColor !== '0') {
            return ColorLevel.ANSI;
        }
        return this._isTTY || isForced ? ColorLevel.ANSI : ColorLevel.NO_COLOR;
    }
    _supportsOsc11() {
        const termProgram = this._envTermProgram || '';
        const term = this._envTerm || '';
        // High-confidence matches (known to work reliably)
        if (termProgram === 'WezTerm' ||
            termProgram === 'iTerm.app' ||
            termProgram === 'iTerm2' ||
            this._envWtSession !== undefined // Windows Terminal
        ) {
            return true;
        }
        // Medium-confidence matches (usually work but can be inherited)
        if (termProgram === 'Apple_Terminal' || termProgram === 'WindowsTerminal') {
            return true;
        }
        // TERM-based detection (more reliable since it reflects actual terminal)
        if (/^xterm-kitty$/.test(term) ||
            /^xterm-ghostty$/.test(term) ||
            /^wezterm$/.test(term) ||
            term === 'alacritty') {
            return true;
        }
        // VTE (generally reliable)
        if (this._envVteVersion) {
            return true;
        }
        // Default to false rather than risking hanging on unsupported terminals
        return false;
    }
}
//# sourceMappingURL=node-color-support-detector.js.map