# LibreGet Extension

[![CI](https://github.com/OpenSelena/libreget-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenSelena/libreget-extension/actions)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-AMO-orange.svg)](https://addons.mozilla.org/en-US/firefox/addon/libreget/)

The official browser companion extension for [LibreGet](https://github.com/OpenSelena/libreget), the free and open-source download manager.

Detect media streams (`.m3u8`, `.mpd`, direct video/audio) while browsing and send them straight to your local LibreGet desktop client with a single click.

---

## Features

- **One-Click Stream Detection**: Automatically sniffs HLS (`.m3u8`), DASH (`.mpd`), and direct media fragments across streaming platforms.
- **Secure Local Pairing**: Pairs directly with your desktop application running on `127.0.0.1:47720` via a short-lived loopback pairing token.
- **Authenticated Cookie Sync**: Safely forwards session cookies for protected media and private courses so downloads complete without authentication errors.
- **Privacy First**: Zero external telemetry, zero tracking, zero third-party servers. All data stays strictly on your local machine.
- **Deep Search & Fallback**: Light DOM player inspection with custom regex and size-filtering rules.

---

## Installation

### Firefox
Install directly from the official Mozilla Add-ons store:
👉 [**Get LibreGet on Firefox Add-ons (AMO)**](https://addons.mozilla.org/en-US/firefox/addon/libreget/)

---

### Chrome, Edge, Brave, and Opera

You can install the extension in under 30 seconds using the pre-built release package:

1. Download `libreget-chrome-extension.zip` from the latest [**GitHub Releases**](https://github.com/OpenSelena/libreget-extension/releases).
2. Unzip the file into a folder on your computer.
3. Open your browser's extension manager:
   - **Chrome / Brave**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
   - **Opera**: `opera://extensions`
4. Enable **Developer mode** (toggle in the top-right or left sidebar).
5. Click **Load unpacked** and select the unzipped extension folder.
6. Pin the LibreGet puzzle piece icon to your toolbar.

---

## How to Pair with LibreGet Desktop

1. Open the **LibreGet** desktop application.
2. Ensure the local bridge is running (default port `47720`).
3. Click the LibreGet extension icon in your browser.
4. If not automatically paired, copy the pairing token from LibreGet Settings (`Settings > Extension > Token`) and paste it into the extension pairing field.
5. Browse to any supported media page — detected streams will appear in the popup with direct download buttons.

---

## Development

### Requirements
- Node.js 18+ (uses native `node:test` runner, no external dependencies).

### Run Test Suite
```bash
npm test
```
Runs all 417 unit tests verifying:
- Media sniffing and stream classification (HLS/DASH).
- Header extraction and cookie sync.
- Loopback IPC bridge security and token handling.
- Scheme fallback protocol (`libreget://`).

### Synchronize Targets
Chrome and Firefox targets share core logic. Use the sync script when editing source files:
```bash
npm run sync
```

### Build Distribution Packages
```bash
npm run build
```
Generates zip archives in `dist/`:
- `dist/libreget-chrome-extension.zip`
- `dist/libreget-firefox-extension.zip`

---

## Security & Privacy Invariants

- **Loopback Only**: All network bridge traffic is locked to `127.0.0.1`.
- **Ephemeral Tokens**: Tokens are stored strictly in local browser storage (`chrome.storage.local`) and never logged.
- **No Remote Scripts**: Pure vanilla JavaScript (Manifest V3), strictly adhering to CSP without `eval()` or unminified external loaders.

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
Part of the [OpenSelena](https://github.com/OpenSelena) ecosystem.
