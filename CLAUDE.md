# CLAUDE.md

## Project Overview

Philips Baby Monitor WiFi QR Code Generator — a single-page, client-side web app that generates QR codes to connect Philips Baby Monitors (models SCD641, SCD971, SCD973) to WiFi without the official app. The QR payload is reverse-engineered JSON: `{"s":"<SSID>","p":"<PASSWORD>","t":"000000000000"}`.

Live site: https://alxbd.github.io/wifi-qr-connect-philips-baby-monitor/

## Architecture

This is a **vanilla HTML/CSS/JavaScript** project with no build step, no framework, and no bundler. All processing happens client-side in the browser.

```
├── index.html            # Main page (form + QR display views)
├── instructions.html     # Step-by-step user guide, FAQ, troubleshooting
├── app.js                # All application logic (245 lines)
├── css/
│   ├── pico.min.css      # Pico CSS framework (base styling)
│   └── styles.css        # Custom styles, responsive layout, print styles
├── js/
│   └── qrcode.min.js     # QRCode.js library (vendored, minified)
├── .github/workflows/
│   └── static.yml        # GitHub Actions: deploy to GitHub Pages on push to main
└── package.json          # Dev server + dependency metadata
```

## Development

```bash
npm install       # Install dependencies (http-server for dev, qrcode)
npm run dev       # Start local server on port 8080, opens browser
```

There is no build, compile, lint, or automated test step. The `test` script is a placeholder for manual testing.

## Key Code Patterns

- **app.js** structure: DOM element refs at top, then helper functions, then event listeners
- **Two-view UI**: `formView` (input form) and `qrView` (QR code display), toggled via `.hidden` CSS class
- **QR generation**: Uses the QRCode.js library to render onto a canvas element
- **Credential storage**: WiFi credentials are saved to `localStorage` with simple XOR obfuscation (not encryption) using a fixed UUID seed
- **Download**: Generates a composite canvas image with the QR code, SSID label, and printed instructions
- **Naming**: camelCase for JS variables/functions; descriptive IDs in HTML

## Conventions

- Vanilla JS only — no frameworks, no TypeScript, no module bundler
- Minimal dependencies (only `qrcode` for QR generation, `http-server` for dev)
- No automated tests — testing is manual (open the app in a browser)
- No linter or formatter configured
- CSS uses custom properties (variables) for colors and spacing
- Print media queries hide interactive UI elements for clean printouts

## Deployment

Pushes to the `main` branch trigger automatic deployment to GitHub Pages via `.github/workflows/static.yml`. The entire repo root is uploaded as-is (no build artifacts).
