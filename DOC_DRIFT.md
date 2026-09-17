# Documentation Drift Report

**Run Date/Time:** 2026-06-27 17:30 UTC
**Branch Analyzed:** dev

## Files Reviewed

- README.md
- FEATURE_COMPARISON.md
- package.json
- src/interfaces.ts
- src/node.ts
- src/browser.ts
- src/colorino-node.ts
- src/colorino-browser.ts
- src/abstract-colorino.ts
- build.config.ts

## Regressions Found

- **README.md ("Extending Colorino" section):** The example imported `ColorinoNode` from `colorino/node` and extended `ColorinoNode`. `colorino/node` is not an exported package subpath in `package.json`, and `ColorinoNode` is an internal implementation class not exported from the package entry points (`src/node.ts` or `src/browser.ts`).

## Files Changed

- README.md
- DOC_DRIFT.md

## Fixes Applied

- Updated `README.md` under **Extending Colorino** to demonstrate extending/wrapping Colorino via composition with `createColorino()` rather than subclassing non-exported `ColorinoNode` from non-existent subpath `colorino/node`.
