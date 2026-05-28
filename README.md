# Akeed Frontend

Next.js 16 frontend for Akeed (embedded Shopify + standalone SaaS modes).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

The app runs on `http://localhost:3001`.

## Main Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

## Branded Message Templates

- Message preview and template selection live in Settings (`/settings?tab=message-preview`).
- `/message-preview` route redirects to the Settings message preview tab.
- Merchants can select template variants per language:
  - Arabic: `standard`, `egyptian`, `gulf`, `short`
  - English: `friendly`, `professional`, `direct`, `short`
- Defaults:
  - Arabic: `standard`
  - English: `friendly`
- Template preview uses the backend contract and mirrors send-time template selection.
