# AGENTS.md — Akeed Frontend

Guidelines for AI coding agents operating in this repository.

## Build / Lint / Typecheck / Dev

```bash
npm run dev            # Start dev server on port 3001
npm run build          # Production build (Next.js)
npm run start          # Run production server on port 3001
npm run lint           # ESLint (flat config)
npx prettier --check "src/**/*.{ts,tsx}"  # Check formatting
npx prettier --write "src/**/*.{ts,tsx}"  # Auto-format
npx tsc --noEmit       # Type-check without emitting
npm run shopify:dev    # Shopify embedded app dev
```

### Testing

No test runner is configured yet. If tests are added (e.g., Vitest):

```bash
npx vitest run                          # Run all tests
npx vitest run src/lib/utils.test.ts    # Run a single test file
npx vitest run -t "test name"           # Run a single test by name
```

Until a runner exists, validate changes with `npm run build && npm run lint`.

## Project Overview

- Framework: Next.js 16 (App Router) with React 19
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS 4 + shadcn/ui primitives (CVA + Radix)
- i18n: next-intl (locales: `ar` default, `en`). Messages in `public/messages/{locale}.json`
- Auth: Dual-mode — Supabase (standalone) / Shopify App Bridge (embedded)
- State: React hooks only (no external state library)
- API client: `fetchWithAuth` / `api.*` in `src/lib/auth.ts`

## Source Layout

```
src/
  app/[locale]/           # Next.js App Router pages (locale-prefixed)
  components/
    ui/                   # Reusable primitives (shadcn-style, barrel-exported via index.ts)
    layout/               # Shell components (AppLayout, Header, Sidebar, EmbeddedLayout)
    sections/             # Marketing page sections (Hero, Pricing, FAQ, etc.)
    forms/                # Form components (WaitlistForm and sub-components)
    auth/                 # AuthGuard, EmbeddedAuthGate
    onboarding/           # Onboarding wizard steps and container
    pages/                # Page-level composition components
  hooks/                  # Custom React hooks (useAkeedMode, useOnboarding, etc.)
  lib/                    # Utilities (auth, http, locale, utils, strings)
  config/                 # Static config objects (site, roi, onboarding)
  types/                  # TypeScript type/model definitions (*.model.ts)
```

## Code Style

### Formatting (Prettier)

- No semicolons
- Single quotes
- 2-space indentation
- Trailing commas: `es5`
- Print width: 80
- Tailwind class sorting via `prettier-plugin-tailwindcss`

### TypeScript

- Strict mode enabled
- Use `type` imports for type-only values: `import type { Foo } from '...'`
- Prefer interfaces for component props, `type` aliases for unions/intersections
- Avoid `any`; use `unknown` and narrow with type guards
- Model files live in `src/types/` with `.model.ts` suffix

### Imports

- Use the `@/*` path alias for all `src/` imports (maps to `./src/*`)
- Never use relative paths that climb more than one level (`../../` is too deep — use `@/`)
- Group imports in this order (no blank lines required, but keep consistent):
  1. React / Next.js / third-party packages
  2. `@/` internal imports (lib, hooks, components, types, config)
  3. Relative sibling/child imports
- UI primitives can be imported from the barrel: `import { Button, Input } from '@/components/ui'`

### Components

- Use named function exports for components (not default, except page/layout files)
- Page components (`page.tsx`, `layout.tsx`) may use default exports
- Section components use default exports (dynamic import pattern)
- Client components must have `'use client'` directive at the top
- Separate domain logic into custom hooks (`src/hooks/use*.ts`), keep components thin
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Use `forwardRef` for primitive UI components that wrap HTML elements
- Set `displayName` on `forwardRef` components

### Naming Conventions

- Files: PascalCase for components (`Button.tsx`), camelCase for hooks/utils (`useHeader.ts`, `auth.ts`)
- Types: PascalCase (`WaitlistFormData`), model files use `.model.ts` suffix
- Hooks: `use` prefix, camelCase (`useAkeedMode`, `useDashboard`)
- Constants/config: camelCase for objects (`faqs`), UPPER_SNAKE for primitive constants (`ROI_DATA`, `AUTH_ROUTES`)
- Component props: `{ComponentName}Props` interface

### Error Handling

- API errors: use `getErrorMessage()` from `src/lib/http.ts` to extract backend messages
- Form validation: Zod schemas + `@hookform/resolvers/zod` with react-hook-form
- Async errors in hooks: catch, log with `console.error('[Context] message:', error)`, set error state
- Use bracket-prefixed log tags: `[Auth]`, `[Akeed]`, `[Onboarding]`
- Never silently swallow errors; at minimum log them

## Runtime Modes — Critical Rules

The app runs in two modes detected by `useAkeedMode()`:

|              | Embedded (Shopify)               | Standalone (SaaS)                   |
| ------------ | -------------------------------- | ----------------------------------- |
| Detection    | URL has `shop` + `host` params   | No `shop`/`host` params             |
| Auth token   | Shopify App Bridge session token | Supabase JWT                        |
| Layout shell | `EmbeddedLayout` (Polaris Frame) | `StandaloneLayout` (custom sidebar) |
| UI kit       | Shopify Polaris components       | Tailwind/shadcn components          |

Rules:

- Never put mode-branching logic inside skin/UI JSX; use hooks or resolver patterns
- Always use `fetchWithAuth` / `api.*` for backend calls — never raw `fetch` with manual tokens
- Test changes against both modes when touching auth, layout, or API code

## i18n — Locale Requirements

- All user-facing text must come from `next-intl` translation keys
- When adding text, update both `public/messages/ar.json` and `public/messages/en.json`
- Use `useTranslations('namespace')` in client components
- Locale routing is enforced by middleware; all routes are under `/{locale}/`
- RTL support: Arabic (`ar`) renders RTL; use `useLocaleInfo()` for `isRTL` checks
- Default locale is `ar` (Arabic) — never assume English-first

## API & Auth

- All authenticated requests go through `src/lib/auth.ts` (`api.get`, `api.post`, etc.)
- Backend base URL: `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:3000`)
- Shopify auth paths are proxied via `next.config.ts` rewrites
- On 401, standalone mode auto-redirects to login; embedded mode logs error only

## Environment Variables

Required variables (see `.env.local`):

- `NEXT_PUBLIC_API_URL` — Backend API base URL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase auth
- `NEXT_PUBLIC_SHOPIFY_API_KEY` — Shopify App Bridge
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_SHEET_ID` — Waitlist (server-only)

Never commit `.env.local` or files containing secrets.

## Common Pitfalls

- Embedded navigation registers a Settings link, but `/settings` route is not implemented yet
- Waitlist types have overlapping models — keep aligned with `useWaitlistForm` and the API route
- Polaris CSS is imported only inside `EmbeddedLayout` — never import it globally
- `suppressHydrationWarning` is used on interactive elements; keep this when wrapping Radix primitives
- Dynamic imports (`next/dynamic` with `{ ssr: false }`) are used for modals and heavy client components
