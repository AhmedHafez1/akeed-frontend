# Standalone UI/UX mockups

These mockups define the proposed direction for the standalone Dashboard,
Verifications, Settings, and Message templates pages. They are implementation
references, not pixel-perfect specifications. Existing product behavior,
permissions, API contracts, and localized copy remain authoritative.

## Shared application shell

- Use a 248 px desktop sidebar and a 56 px utility bar.
- Keep the sidebar white with a subtle right border. Use a soft mint surface,
  emerald icon, and emerald label for the active destination.
- Keep page content on a warm off-white background. Cards remain white with a
  1 px neutral border, restrained shadow, and 12-16 px radius.
- Keep global destinations in this order: Dashboard, Verifications,
  Templates, Settings.
- Keep language, notifications, search, help, and workspace identity in the
  same locations across all protected standalone pages.
- Treat Arabic as a first-class RTL layout. Mirror directional layout and
  icons where appropriate; do not merely right-align English geometry.

## Dashboard

Reference: `standalone-dashboard.png`

- Optimize the first viewport for a five-second operational scan: service
  status, four primary KPIs, trend, quota, and orders needing attention.
- Reduce the current metric-card count. Put secondary totals into the outcome
  breakdown instead of giving every number equal visual weight.
- Keep `New order` as the primary action and the date range as a global page
  filter.
- The attention list is a dashboard summary only. Its `View all` action should
  take the user to the later Verifications experience.
- Use semantic status colors sparingly: emerald for healthy/confirmed, amber
  for waiting or review, and red only for failed/destructive outcomes.

## Verifications

Reference: `standalone-verifications.png`

- Treat this MVP page as a triage workspace: workload overview, filtering,
  full-width results, then capability-driven inline actions.
- Do not add a details modal, drawer, expandable row, selected-row state, or
  order-details route in the MVP.
- Derive lifecycle steps from timestamps already present on the verification;
  do not fabricate events or imply delivery/read states that were not recorded.
- Render retry and cancellation actions only when the server-reported
  capabilities allow them. Preserve the existing confirmation step for a
  destructive cancellation.
- The search and numbered pagination in the visual are directional concepts.
  Do not ship misleading client-only search across a partial cursor page or
  numbered pagination without matching backend support. Preserve `Load more`
  until the API provides the required query and pagination contracts.

### Verify order modal

Reference: `standalone-manual-order-modal.png`

- Keep this as one focused modal with the existing five fields. Do not turn it
  into a wizard or expand it into order management.
- Make customer phone the primary field, group optional identity fields, and
  present amount and currency as one coherent financial-input section.
- Preserve safe idempotent retry, locked uncertain submissions, conflict
  handling, accepted/duplicate results, field-level errors, and permission and
  source-connected gates.
- Align every field label, placeholder, value, helper, and error to the right in
  Arabic and to the left in English. Phone numbers, references, decimal amounts,
  and currency codes retain LTR character ordering inside that locale-aligned
  field.

### Implemented Verifications mapping

- Existing status values and translations remain authoritative. The mockup's
  Awaiting reply control uses `awaiting_response`, which already requests
  `sent,delivered,read,no_reply`. Pending remains available alongside Confirmed,
  Canceled, Failed, and No reply. The selected filter lives in `?status=` and
  preserves other query parameters through refresh and browser history.
- Workload groups are defined in `verificationWorkload.ts`: In progress uses
  `in_progress` (pending/sent/delivered/read); Needs attention uses
  `needs_attention` (failed/expired/no_reply). Completed is the remaining
  confirmed/canceled group: `total - in_progress - needs_attention`. This avoids
  adding timestamp-based outcome counters that can include earlier outcomes.
  Only All maps exactly to an existing UI filter; the other summary cards are
  informational. These groups do not introduce verification statuses.
- Per the final-outcome design refinement, Confirmed and Canceled display three
  green circles. Missing sending/delivery timestamps are described accessibly as
  completed by confirmation or cancellation in Akeed. Other rows mark only their recorded
  events/current lifecycle state; no timestamps are synthesized.
- Standalone cancellation requires both the existing cancellation helper and
  explicit server capability, including while its confirmation is open. The
  embedded legacy-capability presentation and redirect are unchanged.
- The table becomes cards below 768 px, with LTR-isolated phone numbers in both
  locales. Cursor responses are discarded when their query has been superseded.
  Search, additional filters, numbered pagination, and verification details
  remain outside this implementation.

The isolated `/en/verifications` and `/ar/verifications` fixture and its
scenarios are documented in `test/e01-smoke/README.md`.

## Settings

Reference: `standalone-settings.png`

- Replace the long undifferentiated form with an internal settings navigation:
  General, Automation, Billing & usage, and Team.
- Keep related controls inside independent cards. A card-level switch controls
  the enabled state of its dependent fields.
- Make timing relationships visible with the small automation timeline rather
  than forcing users to infer sequencing from numeric inputs.
- Keep save state visible in the page header. Show the sticky action bar only
  when the page can be edited; preserve current read-only permissions.
- `Team` is shown as an information-architecture destination. Do not implement
  it unless the underlying product scope and API exist.

## Message templates

Reference: `standalone-templates.png`

- Keep the editing order explicit: customer language, tone/style, then
  template details.
- Keep the customer preview sticky on desktop so every selection has immediate
  visual feedback.
- Template wording and variables remain backend-driven. The option cards in
  the mockup represent the existing approved variant IDs, not free-form text
  editing.
- Preserve the visible relationship between store language configuration and
  the language-specific variants, with a direct route back to Settings.

## Responsive behavior

- Below 1024 px, collapse the global sidebar into a drawer and allow dashboard
  KPI cards to wrap to two columns.
- Below 768 px, use a single content column. Move Settings section navigation
  to a horizontal scrollable tab row or select. Place the template preview
  below the editor controls.
- Keep primary save actions sticky at the bottom on small screens, with safe
  area padding. Do not make the entire footer sticky when the form is
  read-only or unchanged.

## Suggested shared primitives

- `StandaloneSidebar`
- `StandaloneTopBar`
- `PageHeading`
- `StatusStrip`
- `MetricCard`
- `SettingsSectionNav`
- `SettingsCard`
- `StickySaveBar`
- `TemplateVariantCard`
- `WhatsAppTemplatePreview`

Use existing translation catalogs for all shipped labels and validate both
English LTR and Arabic RTL before considering the implementation complete.
