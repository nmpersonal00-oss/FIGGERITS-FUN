# Sunlit Secrets — Image-Reliable Edition

This fixes the missing-background issue. The two original supplied scenic backgrounds, the full 2,400-level puzzle data and all game code are **embedded directly into index.html**. The page does not request separate CSS, JS, or background assets, so uploading `index.html` alone is enough to play online or from a local file.

## Replace the old GitHub Pages version

1. Unzip this archive.
2. Open your GitHub game repository. Remove or overwrite the old `index.html`, `manifest.webmanifest`, `sw.js` and `assets` content. Upload the **contents** of this ZIP, not the ZIP itself, making sure `index.html` is at the root of the repository.
3. Wait for GitHub Pages to publish the commit.
4. **Important for people who installed the previous edition:** Open `https://YOUR-USERNAME.github.io/YOUR-REPO/index.html?release=v4-imagefix-20261028` in Safari. This exact query string bypasses the original service worker's cached homepage and installs the replacement cache. Reload once after the new page opens. If an old iPhone Home Screen icon still shows the broken edition, remove that icon and add the updated site to your Home Screen again.
5. Once the updated game loads, test offline use by disconnecting Wi-Fi/mobile data after the initial successful installation.

## What is included

- `index.html`: fully self-contained playable game containing BOTH **original** scenery backgrounds and all 2,400 levels; also works if the `assets` directory is missing (except for the optional app icon).
- `manifest.webmanifest` and `sw.js`: installability and updated offline cache with fresh-online navigation.
- `assets/home-original.jpg` and `assets/game-original.png`: unchanged source images for future use, not required for the game to render.
- `assets/icon-192.png`, `assets/icon-512.png`: iPhone / PWA icons.
- `developer-source/`: editable copies of the original CSS and JavaScript. The runtime uses the versions already embedded in index.html; re-bundle if editing these sources.

## Game behavior

All 2,400 puzzle levels remain available in sequential order. You need to complete the current level before unlocking the next. Answers, hints, progress and backup/restore are retained. Progress is saved in local browser storage using the same save key as the previous version. No ads, subscriptions or online requests are required for gameplay after installation.

## Image troubleshooting

This edition renders its scenery with two `data:image/jpeg;base64` URLs that are literally inside the HTML. No WebP support and no external image paths are required. If the imagery does not display, verify that you're on the new URL containing `release=v4-imagefix-20261028` and not an earlier cached version. `index.html` is approximately 2.4 MB because it contains the original home JPEG and an ultra-high-quality JPEG rendition of the game art (original PNG is also supplied). The included original files are provided separately for your convenience.
