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

## Full Local Stack (VS Code)

Open the parent `Akeed` folder in VS Code and run the
`Full Stack: Backend + Standalone + Shopify` launch compound.

- Redis runs in Docker on `localhost:6379`.
- NestJS runs on `http://localhost:3000` and uses the backend `.env`.
- The standalone frontend runs on `http://localhost:3001`.
- The Shopify frontend process runs on `http://localhost:3002`; Shopify's
  localhost HTTPS proxy uses `https://localhost:3458`.

Docker Desktop must be running with virtualization enabled. The backend
`SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` must belong to the app identified in
`shopify.app.local.toml`.

The Shopify launch uses the named local configuration with `--no-update` and
does not deploy or replace production app URLs, redirects, or webhooks.

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
