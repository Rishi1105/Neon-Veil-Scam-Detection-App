# Neon Veil Scam Detection App



## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Features

- Dashboard with live-style stats and active threat list (`src/components/dashboard.tsx`).
- Message Analyzer with shared detection logic and recent history (`src/components/message-analyzer.tsx`).
- Suspect Profile and Incident Map visual sections matching the UI design.
- Shared analyzer module used by the app and extension (`src/lib/analyzer.ts`).
- Chrome Extension (Manifest V3) to analyze pasted or selected text (see `extension/`).

## Chrome Extension (Manifest V3)

The extension lets you:

- Open the popup and paste a message to analyze.
- Right-click selected text on any page and choose "Analyze with Neon Veil"; then open the popup to see the text auto-filled.

### Files

- `extension/manifest.json`: MV3 manifest
- `extension/popup.html` and `extension/popup.js`: Popup UI and analyzer
- `extension/background.js`: Registers context menu and stores the last selection
- `extension/contentScript.js`: Placeholder for future DOM-based features

### Load the extension in Chrome

1. Open `chrome://extensions` in Chrome.
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select the `extension/` folder.
4. The extension icon will appear in the toolbar. Pin it for quick access.
5. Optional: On any page, select text, right-click, and choose "Analyze with Neon Veil". Then open the popup to analyze.

### Notes

- The popup uses a light-weight copy of the analyzer to avoid bundling. The app uses the shared module in `src/lib/analyzer.ts`.
- Recent analyses are stored separately: the web app uses `localStorage`, the extension uses `chrome.storage.local`.
- If you see TypeScript complaints about React or lucide types, run `npm i` and then `npm run dev`.
