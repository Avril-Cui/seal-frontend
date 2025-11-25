# ByeBuy Wishlist Chrome Extension

A Chrome extension built with React and Tailwind CSS that adds Amazon products to your ByeBuy wishlist with a single click.

## Features

- Collects comprehensive product metadata including:
  - Product title
  - Price and currency
  - Rating and review count
  - ASIN (Amazon product ID)
  - Product description
  - Brand
  - Images
  - Availability
  - Product specifications
  - Category breadcrumbs
  - And more...

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run dev
```

## Installation

1. Build the extension (see Setup above)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension` folder (not the dist folder)
6. The extension should now appear in your toolbar

## Usage

1. Navigate to any Amazon product page
2. A floating "Add to ByeBuy Wishlist" button will automatically appear in the bottom right corner
3. Click the button to add the product to your wishlist
4. Open the browser console (F12) to see the collected metadata

## Development

The extension uses:

- **React** - UI component framework
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool

After making changes to the source code, rebuild with `npm run build` and reload the extension in Chrome.

## Files

- `src/content.jsx` - Main React component and product fetching logic
- `src/styles.css` - Tailwind imports
- `manifest.json` - Extension configuration
- `vite.config.js` - Build configuration

## Note

Currently, the extension logs data to the console. Future versions will add functionality to save or export this data.
