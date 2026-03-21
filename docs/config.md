# Configuration

Colorino auto-detects your environment and color support. You can override its behavior using standard environment variables (compatible with Chalk):

| Variable         | What It Does                                                                                           | Example                        |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `NO_COLOR`       | Removes all colors from output (any value works)                                                       | `NO_COLOR=1 node app.js`       |
| `FORCE_COLOR`    | Override color detection: `0`=none, `1`=basic (16 colors), `2`=extended (256), `3`=full RGB            | `FORCE_COLOR=3 node app.js`    |
| `CLICOLOR`       | Set to `0` to disable colors                                                                           | `CLICOLOR=0 node app.js`       |
| `CLICOLOR_FORCE` | Set to `1` to force colors even when output is piped/redirected                                        | `CLICOLOR_FORCE=1 node app.js` |
| `TERM`           | Your terminal type (e.g., `xterm-256color` enables 256 colors) — auto-set by your terminal             | `TERM=xterm-256color`          |
| `COLORTERM`      | Set to `truecolor` or `24bit` to enable full RGB colors — auto-set by modern terminals                 | `COLORTERM=truecolor`          |
| `TERM_PROGRAM`   | Terminal program name (e.g., `WezTerm`, `iTerm2`) — auto-set by terminals for OSC 11 support           | (automatic)                    |
| `VTE_VERSION`    | VTE library version — auto-set by GNOME Terminal and VTE-based terminals for OSC 11 detection          | (automatic)                    |
| `WT_SESSION`     | Auto-set by Windows Terminal to enable advanced colors and OSC 11 theme detection (don't set manually) | (automatic)                    |
| `CI`             | Auto-set by GitHub Actions, GitLab CI, etc. to disable colors in build logs                            | `CI=true`                      |
