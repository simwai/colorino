# Documentation Drift Report

**Run Date/Time:** 2025-06-25 06:15 UTC
**Branch Analyzed:** dev

## Files Reviewed
- README.md
- FEATURE_COMPARISON.md
- package.json
- src/interfaces.ts
- src/colorino-node.ts
- src/abstract-colorino.ts
- src/colorino-browser.ts
- src/node.ts

## Regressions Found
- `README.md`: Corrupted Installation section containing an accidental duplicate Table of Contents inside a code block.
- `README.md`: Stale call-site output example `[main.ts:10:5@someFunction]` which did not match the actual implementation `[someFunction@main.ts:10:5]`.
- `README.md`: Broken internal link to API Reference options (`#2-3` instead of `#3-3`).
- `README.md`: Missing documentation for the `resolve` hook in `CallSiteConfig`.

## Files Changed
- README.md

## Fixes Made
- Removed the corrupted duplicate Table of Contents from the Installation section and fixed package manager commands.
- Corrected the call-site output format in documentation to match the library's behavior.
- Fixed the broken internal link to Options & Theme Overrides.
- Added documentation for the `resolve` hook in the `CallSiteConfig` properties list.
- Refactored `README.md` to use `<!-- toc -->` markers for reliable Table of Contents regeneration.
- Simplified installation code blocks to avoid `md-toc-cli` misinterpreting `#` comments as headers.
- Regenerated the Table of Contents to ensure all links are valid and up-to-date.
