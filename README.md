# Sunlit Secrets — Approved Floral Sunset Layout (v5)

This edition reworks the actual interactive game to match the **two supplied screenshots**. It uses the original user-supplied blank artwork for the home and game scenes, plus a carefully feathered, transparent crop of the approved **circular floral Play button**. The screens now have a large, round button, a higher title, more generous separation, larger keyboard keys and roomier wooden clue panels.

## Put it on GitHub Pages

1. Unzip this package. Upload the **files inside** the extracted folder to the root of your existing Sunlit Secrets GitHub repository, replacing earlier files (including `index.html`, `sw.js`, `manifest.webmanifest`).
2. Ensure GitHub Pages is configured to deploy `main` from `/ (root)`.
3. Visit `https://YOUR-USERNAME.github.io/YOUR-REPO/index.html?release=v5-approved-layout-20261029` once in Safari to bypass older cached HTML. After the site displays the corrected design, choose Share → Add to Home Screen.
4. Existing saves use the same localStorage key, `sunlit-secrets-progress-v1`. Do not clear website data. Use Settings → Save backup for an extra copy.

## Guarantees and limits

- `index.html` embeds all CSS, scripts, both scenic backgrounds and the floral Play-button image directly. It can run by itself on a computer and avoids missing asset folder issues.
- Contains the same 2,400 word puzzles, clue numbers, letter filling, unlimited hints, check work, backspace, sound, backup/restore and strict level-by-level unlocking as before. Only the presentation layer was rebuilt.
- The puzzle clue section scrolls internally when a level has more than three clues. Longer sayings can scroll within the saying area, rather than shrinking their letters to unreadable sizes.
- On a very small phone, fewer clues may be visible at once; scroll the wood panel to continue. This is intentional, not a broken layout.
- Mobile Safari and installation behavior should be checked on your actual iPhone after deployment; local tests use Chromium phone-sized viewports.

## Project files

- `index.html`: complete standalone game; graphics built into the file.
- `app.js`, `data.js`, `expansion.js`, `styles.css`: separately readable and editable sources. To edit the live version, rebuild or directly edit `index.html`, because it is self-contained.
- `assets/`: your original clean home/game backgrounds, floral Play artwork, and PWA icons.
- `sw.js`, `manifest.webmanifest`: installability/offline support and new cache version.
