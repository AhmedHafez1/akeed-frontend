# Standalone Verify order modal implementation prompt

```text
Implement the redesigned Akeed standalone Verify order modal using this visual
reference:

C:\Work\Akeed\akeed-frontend\docs\ui-ux-mockups\standalone-manual-order-modal.png

Read before editing:
- C:\Work\Akeed\AGENTS.md
- C:\Work\Akeed\akeed-frontend\AGENTS.md
- C:\Work\Akeed\akeed-frontend\docs\ui-ux-mockups\README.md

Primary targets:
- src/features/orders/skins/standalone/ManualOrderEntryStandalone.tsx
- src/features/orders/domain/useManualOrderEntry.ts
- src/features/orders/domain/manualOrder.model.ts
- public/messages/en.json
- public/messages/ar.json

Reference existing primitives rather than introducing another modal system:
- src/shared/ui/dialog.tsx
- src/shared/ui/international-phone-input.tsx
- src/shared/ui/input.tsx
- src/shared/ui/button.tsx

Scope:
- Redesign the standalone ManualOrderEntryStandalone presentation only.
- Preserve the current API payload, validation schema, idempotency token,
  timeout, retry, conflict, accepted/duplicate result, permissions, and source
  gates.
- Do not change the backend or add new order fields.
- The form must continue collecting exactly five values:
  - Customer phone, required
  - Customer name, optional
  - Order reference, optional
  - Order amount, required
  - Currency, required
- Payment method remains the existing cash_on_delivery constant and must not
  become a user-facing field.
- Do not add address, products, notes, payment method, shipping, or customer
  details beyond the existing contract.
- Do not turn the modal into a multi-step wizard.
- Field alignment is locale-driven without exceptions: labels, placeholders,
  entered values, selected values, helpers, and validation errors align right
  in Arabic and left in English.

Objective:
Reduce perceived effort, make the required path obvious, and give merchants
confidence that the order is safely accepted before verification begins. The
modal must feel equally intentional in Arabic RTL and English LTR.

1. Modal shell
- Keep the existing accessible Dialog primitives.
- Use approximately 640 px maximum desktop width, max-height within 90vh, and a
  scrollable content area when necessary.
- Use a warm-white surface, 16-18 px radius, neutral border, restrained shadow,
  and approximately 28 px desktop padding.
- Use a neutral translucent backdrop. Avoid blur-heavy glass effects.
- Keep the close button at the visual top-left in RTL and top-right in LTR.
- Maintain at least a 40x40 px close hit target and a localized accessible name.
- Preserve focus trapping and return focus to the Verify order trigger on close.
- Preserve the current rule that Escape, outside click, and close are blocked
  while a submission is in flight.

2. Header
- Add a small soft-mint icon tile using an existing Lucide icon.
- Keep the localized title and description from the manualOrder catalog.
- Keep the heading concise and do not repeat it in the body.

3. Form hierarchy
- Add a localized Customer details section heading.
- Make Customer phone the first and most prominent full-width field.
- Preserve InternationalPhoneInput, country selector, E.164 value handling,
  existing validation, and automatic focus when the modal opens.
- In Arabic, place the visible country/phone input group at the right edge of
  the control; in English, place it at the left edge.
- Keep phone digits and country calling code LTR-isolated in both locales while
  aligning the containing input content right in Arabic and left in English.
- Keep the localized helper text directly beneath the phone control.
- Put Customer name and Order reference in a two-column row on desktop.
- Make optional status visually quiet. If labels are split into label plus an
  optional badge, update both locale catalogs rather than parsing translated
  strings at runtime.
- Add a localized Order details section heading separated by a subtle divider.
- Put Order amount and Currency on one desktop row, with amount slightly wider.
- Align customer name, order-reference placeholder/value, amount value, and
  currency selection right in Arabic and left in English.
- Keep amounts, order references, and ISO currency codes LTR-isolated so their
  character order stays correct even when the Arabic field is right-aligned.
- Preserve all current max lengths, decimal validation, supported currencies,
  aria-invalid, aria-describedby, and field-error behavior.
- Stack every field vertically below the small breakpoint.

4. Trust message
- Add one compact pale-mint informational strip below the inputs.
- Suggested localized meaning:
  - Title: Safe WhatsApp verification
  - Description: The order is saved first and then sent for verification. No
    external order system is updated.
- Add explicit English and Arabic translation keys.
- Keep this informational; do not imply that message delivery is guaranteed.

5. Footer actions
- Separate the footer with a subtle top divider.
- Keep Cancel as the secondary outlined action.
- Keep Verify order as the emerald primary action.
- Follow locale direction for action placement while preserving logical keyboard
  order.
- During submission, keep all fields disabled, retain the localized submitting
  label, prevent duplicate requests, and expose progress accessibly.

6. Validation and server feedback
- Keep inline errors immediately below their associated fields.
- Focus the first invalid field using the existing field order.
- Keep form-level warning or critical feedback above the affected form section.
- Do not communicate errors using color alone.
- Preserve the current server-field-error mapping and unexpected-error handling.
- Do not clear merchant input after a failed request.

7. Safe retry and conflict states
- Preserve the existing 30-second uncertainty behavior and idempotency token.
- When the outcome is uncertain, lock the submitted values and explain that a
  safe retry reuses the same token.
- Keep Retry safely as the primary action in retry mode.
- Keep Start over behind its explicit warning and confirmation.
- Never silently create a new token after an uncertain submission.
- Preserve the conflict state where retry is unavailable.

8. Accepted result state
- Reuse the same modal shell rather than opening another dialog.
- Clearly distinguish Accepted / verification pending from sent, delivered, or
  confirmed. Do not claim that WhatsApp delivery already happened.
- Preserve the duplicate-recovery wording when duplicate is true.
- Keep the order ID visible and copy-friendly.
- Preserve Close, Verify another order, and View verifications actions.
- Reset the flow only under the existing safe close/reset behavior.

9. RTL and responsive behavior
- Build logical layout with start/end and RTL-aware grid ordering.
- In Arabic, all field labels, placeholders, input values, select values,
  helper text, validation messages, section headings, and descriptive text must
  be visually right-aligned.
- In English, all corresponding field and supporting text must be visually
  left-aligned.
- Do not rely only on inherited direction for numeric controls. Where a phone,
  amount, reference, or currency element uses dir="ltr", explicitly apply the
  locale-aware visual text alignment as well.
- Phone numbers, calling codes, order references, amounts, currency codes, and
  generated order IDs remain LTR-isolated.
- In RTL, position dropdown chevrons and country selectors on the logical
  opposite edge without overlapping the right-aligned field content. Mirror
  these positions in LTR.
- At narrow widths, use a near-full-width modal, reduce horizontal padding, stack
  all fields, and keep footer actions reachable with safe-area padding.
- Test zoom and small-height laptop viewports so no field or action is trapped
  below the viewport.

Visual system:
- Match the standalone mockups: warm white, deep ink text, emerald primary,
  soft mint focus/information states, neutral slate borders, and coral red only
  for required/error/destructive meaning.
- Use an 8 px spacing rhythm and clear 44-48 px control heights.
- Avoid gradients, glassmorphism, excessive shadows, decorative illustrations,
  and oversized headings.

Acceptance criteria:
- Only the existing five inputs are rendered.
- Existing payload and validation behavior are unchanged.
- Every field and supporting message aligns right in Arabic and left in English.
- Phone and numeric character ordering remains correct in both locales.
- Initial focus, focus trap, focus restoration, Escape behavior, and close
  blocking during submission still work.
- Safe retry reuses the original idempotency token and keeps values locked.
- Conflict and start-over warnings remain explicit.
- Accepted and duplicate result states remain accurate.
- Source-disconnected and read-only trigger states remain correct.
- No backend or embedded-mode behavior changes.

Validation:
npm --prefix akeed-frontend run build
npm --prefix akeed-frontend run lint
npm --prefix akeed-frontend exec tsc --noEmit
```
