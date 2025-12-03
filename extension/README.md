# ByeBuy Wishlist Chrome Extension

A Chrome extension built with React and Tailwind CSS that adds Amazon products to your ByeBuy wishlist with reflection prompts to encourage mindful purchasing.

## Features

- **User Authentication** - Login with your ByeBuy account
- **Reflection Questions** - Answer prompts before adding items:
  - Why do you want this item?
  - Is this a need or a want?
  - Would Future-You approve?
- **Collapsible UI** - Minimizes to a pig icon, expands on click
- **Product Data Collection** - Automatically captures:
  - Product title, price, and images
  - Description and specifications
  - ASIN, rating, availability, and more

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
2. A floating pig icon appears in the bottom right corner
3. Click to expand the ByeBuy panel
4. If not logged in, enter your ByeBuy credentials
5. Fill out the reflection questions
6. Click "Add to ByeBuy Wishlist" to save the item

## Development

The extension uses:

- **React** - UI components
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Chrome Storage API** - Session persistence

After making changes, rebuild with `npm run build` and reload the extension in Chrome.

## Files

- `src/content.jsx` - Main React component, login form, and product scraping
- `src/background.js` - API calls (login, logout, add item)
- `src/styles.css` - Tailwind imports and CSS overrides
- `manifest.json` - Extension configuration
- `vite.config.js` - Build configuration (copies pig icon from main app)

## API Endpoints

The extension communicates with these backend endpoints:

- `POST /api/UserAuth/login` - Authenticate user
- `POST /api/Sessioning/delete` - Logout
- `POST /api/ItemCollection/addItemFromExtension` - Add item to wishlist
