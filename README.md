# Sunlit Secrets — The Hidden Thought

A cozy, ad-free, number-and-word puzzle game with **2,400 playable levels** and the exact sunset-balcony scenery you supplied.

## What you get

- Beautiful, uncluttered start screen featuring your glowing lakeside bunny-balcony background
- Beautiful gameplay screen using your floral lake background and warm wooden puzzle panels
- Number-to-letter cryptogram clues that reveal a hidden saying
- 2,400 distinct hidden sayings, including 48 individually authored originals and 2,352 template-built variations
- Level progression in **strict order**: finish the current level before unlocking the next
- Unlimited free hints, erase, check answers, touch-friendly QWERTY keyboard and physical keyboard support
- Automatic local progress, backup/restore, optional sound and animation settings
- No ads, subscription, external analytics, account or tracking; static files only
- Progressive web app (PWA) and offline cache after the first successful online visit

## Publish on GitHub Pages

1. Unzip the package. Keep **all the files together**, with `index.html` at the root and `assets/` alongside it.
2. On GitHub, create a **new public repository**, for example `sunlit-secrets`. This is a *separate* app from your health app. Upload the **contents of the unzipped folder**, not the ZIP file itself.
3. Open **Settings → Pages**. Choose **Deploy from a branch**, `main`, `/(root)`, then **Save**.
4. Open the HTTPS GitHub Pages URL shown there after GitHub builds the site. If your repository is named `sunlit-secrets`, the URL will generally have the form `https://YOURUSERNAME.github.io/sunlit-secrets/`.
5. On iPhone, open the Pages URL in **Safari**. Use **Share → Add to Home Screen**, then open your new app icon.
6. Open the game while online the first time, so the service worker can cache all art and code. Offline play can then work from the installed app after a successful first cache. Test it in Airplane Mode before relying on it.

## Important notes

- The user's supplied background art is included locally (compressed high-quality WEBP) so no network images are needed.
- The two scenery backgrounds are preserved as actual art assets; gameplay UI is real HTML, CSS and JavaScript, not buttons painted into an image.
- Save data stays in the browser on the device; it does **not** synchronize between devices. Use Settings → Save backup to export a file and Settings → Load backup to restore it. Clearing site storage can remove progress.
- Original old Sunlit Secrets v1 save data is recognized where possible. The new sequential-lock requirement may restrict previously skipped levels until preceding levels are completed.
- A service worker cannot fully work by double-clicking `index.html`; host over HTTPS (such as GitHub Pages) for installation and offline caching.
- Some browser themes, safe areas and device sizes change where the real phone status icons appear; iOS owns those icons rather than the game drawing fake battery/time indicators.

## Files

- `index.html` — main entry point
- `styles.css` — complete new warm floral interface
- `app.js` — game logic, UI, storage, strictly sequential unlocking
- `data.js` — original clues and first 48 sayings
- `expansion.js` — additional 2,352 sayings
- `assets/home.webp` — supplied first-page background
- `assets/game.webp` — supplied gameplay background
- `assets/icon-192.png`, `assets/icon-512.png` — app icons from supplied artwork
- `manifest.webmanifest`, `sw.js` — add-to-home-screen / offline support

## Testing performed

- Syntax validation of all JavaScript files.
- Browser-driven interaction tests of both screens, letter propagation, erase, hints, win celebration, next level, resume, and locked levels.
- Programmatic coverage validation of all 2,400 puzzles, ensuring every letter appearing in the hidden saying is represented by a playable clue.
- Mobile viewport tests at 320×568, 390×844 and 430×932; gameplay UI verified with zero reported JavaScript errors in Chromium.
- Actual GitHub Pages publishing and physical iPhone install were not performed in this environment and should be checked after upload.

Enjoy your garden. ❀
