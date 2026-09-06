# Standalone Verifications implementation prompt

```text
Implement the redesigned Akeed standalone Verifications page using this visual
reference:

C:\Work\Akeed\akeed-frontend\docs\ui-ux-mockups\standalone-verifications.png

Read before editing:
- C:\Work\Akeed\AGENTS.md
- C:\Work\Akeed\akeed-frontend\AGENTS.md
- C:\Work\Akeed\akeed-frontend\docs\ui-ux-mockups\README.md

Primary targets:
- src/app/[locale]/verifications/page.tsx
- src/features/dashboard/skins/standalone/DashboardVerificationsStandaloneSkin.tsx
- src/features/dashboard/skins/standalone/components/StandaloneVerificationsSection.tsx
- src/features/dashboard/skins/standalone/VerificationsTableStandalone.tsx

Supporting domain references:
- src/features/dashboard/model/dashboard.model.ts
- src/features/dashboard/domain/verificationLifecycle.ts
- src/features/dashboard/domain/verificationRow.ts
- src/features/dashboard/domain/cancellation.ts

Scope and constraints:
- Redesign standalone mode only.
- Do not visually change the embedded Shopify dashboard or its redirect flow.
- Preserve the existing API contracts, cursor loading, permissions, actions,
  status vocabulary, reporting timezone, and localized explanations.
- Use the backend-reported row capabilities as the sole authority for retry and
  cancellation actions. Never infer an action from status alone.
- Use translation keys for every shipped label and update both English and
  Arabic catalogs.
- Verify proper Arabic RTL behavior, not only right-aligned content.
- Reuse existing dashboard hooks and domain helpers. Avoid duplicating status,
  formatting, or cancellation logic in UI components.

Objective:
Turn the current passive, horizontally dense table into a polished operational
triage workspace. A merchant should be able to understand the workload, narrow
the list, scan a full-width table, understand each verification at a glance,
and take a valid inline action. Do not implement verification details for MVP.

1. Page header
- Add a small localized Operations eyebrow, Verifications title, and concise
  subtitle.
- Keep the existing date-range selector.
- Keep ManualOrderEntryStandalone as the primary Verify order action.
- Preserve its permission and source-connected behavior.

2. Workload summary
- Add four compact, clickable summary cards:
  - All verifications
  - In progress
  - Needs attention
  - Completed
- Derive values from real statistics already returned by the dashboard data.
- Define groupings in a typed domain helper rather than scattering status
  conditions through JSX.
- A selected summary card should update the applicable existing status filter.
- If an exact grouping cannot be represented by the current API filter, do not
  fake it. Render it as non-interactive information or add backend support in a
  separately scoped change.

3. Filter toolbar
- Present existing status filters in a clearer toolbar with visible selected
  state and accessible pressed semantics.
- Keep the active status in the URL query parameter so refresh, back, and
  shared links behave predictably.
- The mockup shows search and More filters as the intended future structure.
- Implement search only if the endpoint supports a server-side query covering
  all matching records. Do not client-filter only the currently loaded cursor
  page while implying global results.
- Implement additional filters only when their API contract exists.
- Hide unsupported controls rather than shipping decorative controls.

4. Results table
- Reduce horizontal scanning by combining order and customer identity into one
  column on desktop.
- Suggested columns:
  - Order & customer
  - Status/lifecycle
  - Follow-up
  - Total
  - Created
  - Actions
- Keep full order reference, customer name, phone, amount, and timezone-aware
  created time accessible.
- Use concise semantic status pills and a short localized status/reason
  explanation beneath the lifecycle rail when it helps the merchant act.
- Add a restrained lifecycle rail only from recorded timestamps and status:
  queued/sent, delivered/read, and final outcome. Never show an event as
  completed when its timestamp or lifecycle state does not support it.
- Rows are not selectable in the MVP. Do not add chevrons, clickable-row
  styling, selection state, an expandable row, modal, drawer, or details route.
- Preserve the test-verification badge.

5. Inline actions
- Keep the results table full-width and make the Actions column the only row
  interaction surface for the MVP.
- Retry must call the existing retry handler and appear only when
  retry_verification is server-supported.
- Cancellation must appear only when the existing cancellation helpers and
  capability data allow it.
- Preserve the explicit cancellation confirmation step and current explanatory
  copy. Never turn cancellation into a one-click destructive action.
- Keep the existing inline confirmation UI for cancellation, including confirm
  and keep-order actions.
- Show per-record action errors beneath that row's actions.
- Use compact buttons with explicit text. Do not hide the only important MVP
  actions inside a generic overflow menu.
- Render a muted em dash when the server reports no supported action.

6. Responsive behavior
- At desktop and tablet widths, keep the results table full-width.
- On mobile, render results as stacked cards with the essential order, customer,
  amount, status, created time, and capability-driven actions.
- Collapse summary cards to two columns and then one/two compact rows.
- Keep filters reachable without forcing the entire page to scroll horizontally.
- Phones must remain LTR-isolated inside both English and Arabic layouts.

7. Loading, empty, and permission states
- Use skeletons that preserve the final summary and table geometry.
- Keep the existing all-results empty state and test-verification panel.
- Keep the filtered empty state distinct from the first-use empty state.
- Preserve disconnected-source and read-only notices.
- Partial failures must not erase already loaded records.

8. Pagination
- The current endpoint uses cursor pagination and Load more.
- Preserve Load more unless the backend adds page indexes and stable totals.
- The numbered pagination shown in the mockup is a directional design concept,
  not authorization to emulate page numbers on top of cursor data.

Visual system:
- Match the other standalone mockups: warm off-white app background, white
  surfaces, deep ink text, emerald primary, soft mint selection, amber
  attention, and red only for errors/destructive outcomes.
- Use 12-16 px card radii, subtle neutral borders, restrained shadows, and an
  8 px spacing rhythm.
- Avoid gradients, glassmorphism, oversized metrics, excessive status colors,
  and unnecessary decoration.

Acceptance criteria:
- The standalone page closely follows the reference hierarchy and polish.
- Existing date and status filters still work and remain URL-compatible.
- Cursor loading remains correct.
- Totals and lifecycle events are never fabricated.
- Retry and cancellation remain capability-driven.
- Cancellation still requires confirmation.
- No verification details modal, drawer, expandable row, or details page is
  introduced for the MVP.
- Empty, loading, disconnected, read-only, and action-error states work.
- English LTR and Arabic RTL are visually verified.
- Embedded mode is unchanged.

Validation:
npm --prefix akeed-frontend run build
npm --prefix akeed-frontend run lint
npm --prefix akeed-frontend exec tsc --noEmit
```
