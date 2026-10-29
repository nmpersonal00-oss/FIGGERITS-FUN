# Sunlit Secrets — 2,400-Level Word Puzzle Garden

**A complete, private, ad-free, original word-and-number puzzle game.** Inspired by the general number-to-letter cryptogram mechanic of crossword-style puzzle games; this is an independent creation, **not affiliated with Figgerits or Hitapps**. It does not use that game's artwork, branding, level text, or proprietary assets.

## Features

- **2,400 playable, distinct levels**: six illustrated chapters with **400 levels each**.
- **48 individually written sayings** from the original edition, plus **2,352 unique phrases systematically composed from curated scenic word lists and 28 original sentence templates**. These thousands of combinations are valid playable puzzles, but not 2,352 individually authored stories.
- **242 original word-definition clues** recombined deterministically for each level. Every puzzle covers all the hidden phrase's letters, with a consistent one-to-one number/letter mapping.
- **Six illustrated, original SVG scenes**, warm gardens, sunsets, coastlines, woodland, and a moonlit garden, complete with gentle animated fireflies and victory confetti.
- Free unlimited hints, error checking, touchscreen keyboard, full keyboard support, no timers or penalties.
- Progress saved on this browser/device, manual export/import of backup JSON, optional sounds and animations.
- Free; **no advertising, in-app purchases, analytics, accounts, subscriptions, or runtime third-party dependencies**.
- Installable progressive web app (PWA), which caches its assets for offline play after the first successful hosted load.

## Upload to GitHub Pages

**Important: GitHub Pages cannot deploy a ZIP file as a single ZIP. You must unzip it first.**

1. Unzip `sunlit-secrets-2400-github-ready.zip` on your computer (or extract its contents through your preferred Git workflow).
2. On GitHub, create a **new** repository, for example `sunlit-secrets-game` (do not overwrite your existing health app).
3. Open **Add file → Upload files**, then upload all the extracted site files and the `assets` folder to the **repository root**. The homepage `index.html` must be at the top level, **not** in an extra `sunlit-secrets/` folder. For folder uploads, dragging the extracted folder's contents into GitHub's upload interface or using GitHub Desktop is often easiest.
4. Commit the files on your default (`main`) branch.
5. Go to **Settings → Pages → Build and deployment**. Set source to **Deploy from a branch**, branch **main**, folder **/(root)**; save.
6. After GitHub shows a published HTTPS Pages link, open it in Safari on your iPhone and choose **Share → Add to Home Screen**. Launch your game from the Home Screen.
7. Open the game online once so the service worker can cache all local assets. After that it can work offline as long as browser storage remains intact.

Your progress stays local to the site and device. **If you switch URLs/domains or browsers, progress will not transfer automatically**; export from the old game via **Settings → Export backup**, then import the JSON backup in the new game.

## Files you need at the repository root

```
index.html                Web app entry point
styles.css                Warm responsive desktop and phone UI
app.js                    Puzzle game, progress, selection, hints, chapter navigation
manifest.webmanifest      Installability / iPhone home-screen metadata
sw.js                     Offline-cache service worker
data.js                   Original 48 sayings + clue dictionary
expansion.js              2,352 distinct composed sayings bundled for offline use
assets/                   Six scenic SVGs + app icons
README.md                 This guide
```

The ZIP intentionally includes only the files needed to publish, along with this README. The optional generator and test scripts are kept separately in the development workspace.

## Play without uploading anything

The separate file **`sunlit-secrets-play-2400.html`** is a complete one-file standalone edition (styles, art, and 2,400 levels embedded). Open it in a desktop browser with no network connection. Some browsers restrict persistent storage for local `file://` pages; for reliable saved progress and iPhone installation, use GitHub Pages / HTTPS.

## Puzzle construction and continuity

The original edition's **first 48 level identifiers** are preserved so saved answers continue to refer to the same puzzles. Each of the six chapters starts with its original eight individually written sayings, followed by 392 more. Expanded levels use unique curated-template-composed sayings; the clue bank is reused in different deterministic configurations (you will see repeated clue definitions across levels). All 2,400 levels are selectable from the chapter screen via 40-level pages.

The local save key and backup version remain the same, making existing backups from the 48-level version importable. Never count on browser storage surviving if the user clears site data, deletes the app, uses private browsing, or changes domains; use manual backup.

## Tests performed

- Node.js syntax validation for all JavaScript files.
- Exhaustive generation of all **2,400 levels**; checked number/letter uniqueness and full secret-phrase character coverage.
- Automated hint-to-completion and wrong-letter rejection tests.
- Automated Chromium interactions on a **390×844 mobile viewport and 1440×900 desktop viewport**, using the standalone HTML in an in-memory page: home, chapter selection, paging to level 361, free hint, number-to-letter input, secret phrase victory, and next puzzle. No JavaScript errors in those tested flows.
- Package archive integrity and linked-asset checks.

**Limits of verification:** This environment's browser blocks navigation to `file://` and `http://127.0.0.1`, so Chromium tests were carried out using embedded content. An actual GitHub Pages deployment, mobile Safari installation, service-worker offline lifecycle, and long-term device storage have not been physically verified; test these once deployed. No cloud sync or multiplayer included.

## Credit

The game artwork, puzzle content, data, and code are original to this independent project. The number-to-letter clue mechanic is a general puzzle-game mechanic and is not a claim of affiliation with Figgerits.
