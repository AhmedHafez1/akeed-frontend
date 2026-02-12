# Akeed Frontend Architecture Context (for Agents)

## Purpose
This guide helps agents ship frontend changes safely by clarifying runtime modes, routing, auth behavior, and where feature logic should live.

## What This App Does
- Runs as a localized Next.js app (`ar` default, `en` supported).
- Serves two runtime experiences:
  - Shopify embedded app inside Admin iframe.
  - Standalone SaaS portal.
- Renders marketing pages, auth/onboarding flows, and the dashboard UI.
- Talks to backend APIs using mode-aware authentication.

## Stack and Core Patterns
- Next.js App Router (`src/app`)
- `next-intl` for locale routing/messages
- Supabase client auth for standalone mode
- Shopify App Bridge for embedded mode
- Polaris components for embedded dashboard skin
- Tailwind/shadcn-style components for standalone skin

## Runtime Modes
Mode detection lives in `useAkeedMode`:
- Embedded mode if URL has both `shop` and `host` query params.
- Otherwise standalone mode.

Why it matters:
- Token source changes by mode.
- Layout shell changes by mode.
- Marketing scripts are disabled in embedded mode.

## Routing and Layout
- Locale prefix is enforced by middleware.
- Main pages:
  - `/{locale}` root (marketing in standalone, redirect to dashboard in embedded)
  - `/{locale}/dashboard`
  - `/{locale}/login`
  - `/{locale}/signup`
  - `/{locale}/onboarding`

Layout composition:
- `AppLayout` chooses shell:
  - `EmbeddedLayout` (Polaris `AppProvider` + `Frame`)
  - `StandaloneLayout` (custom header/sidebar + `AuthGuard`)

## Authentication and API Contract
All backend calls should go through `fetchWithAuth` / `api` in `src/lib/auth.ts`.

Token behavior:
- Embedded: App Bridge session token (`getSessionToken`).
- Standalone: Supabase session access token.

Backend expectations:
- API routes require `Authorization: Bearer <token>` for protected endpoints.
- Backend guard supports both token types and returns a unified auth context.

## Feature Map

### Marketing Site
- Page composition in `src/components/pages/HomePage.tsx`.
- Sections under `src/components/sections`.
- Includes demo chat simulation and ROI/pricing/FAQ content.

### Waitlist Capture
- Client form logic: `useWaitlistForm`.
- API route: `POST /api/waitlist`.
- Server route appends rows to Google Sheets via service account creds.

### Standalone Auth
- Login/signup pages use Supabase email/password auth.
- `AuthGuard` protects non-auth standalone routes.

### Onboarding
- Wizard flow in `useOnboarding` + onboarding components.
- Calls backend:
  - `POST /api/organizations`
  - `PATCH /api/organizations/current`

### Dashboard
- Thin page orchestrator + domain/skin split.
- Domain hook: `useDashboard` (logic only).
- Skins:
  - `DashboardStandaloneSkin` (Tailwind)
  - `DashboardEmbeddedSkin` (Polaris)
- Data source: `GET /api/verifications` with optional status filter.

### Embedded Install Gate
- `EmbeddedAuthGate` checks installation with `/auth/shopify/check`.
- Redirects to `/auth/shopify` if app is not installed.

## Configuration Surfaces
Main frontend env vars:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SHOPIFY_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

Rewrites/proxy behavior:
- `next.config.ts` rewrites Shopify auth paths and `/api/:path*` to backend API base URL.

## Agent Editing Guide
- New business logic for dashboard: add to domain hook layer first, then pass to both skins.
- Do not put mode branching inside skin JSX; use resolver/domain patterns.
- For auth/API changes, update `src/lib/auth.ts` first and verify both modes.
- If adding locale text, update both:
  - `public/messages/en.json`
  - `public/messages/ar.json`
- For embedded UX changes, verify compatibility with Polaris and App Bridge navigation.

## Known Caveats
- Embedded navigation registers a settings link, but settings page route is not implemented.
- Waitlist type files include overlapping models; keep usage aligned with `useWaitlistForm` and API route shape.
