# Standalone onboarding implementation prompt

```text
Implement the redesigned Akeed standalone onboarding experience using this
visual reference:

C:\Work\Akeed\akeed-frontend\docs\ui-ux-mockups\standalone-onboarding.png

Read before editing:
- C:\Work\Akeed\AGENTS.md
- C:\Work\Akeed\akeed-frontend\AGENTS.md
- C:\Work\Akeed\akeed-frontend\docs\ui-ux-mockups\README.md

Primary targets:
- src/features/onboarding/ui/standalone/StandaloneOnboardingPage.tsx
- src/features/onboarding/hooks/useStandaloneOnboarding.ts
- src/features/onboarding/domain/onboarding.types.ts
- src/shared/layout/StandaloneLayout.tsx
- public/messages/en.json
- public/messages/ar.json

Scope:
- Redesign standalone onboarding only. Do not alter the embedded Shopify
  configuration/billing steps or Polaris UI.
- Preserve the existing onboarding fetch, settings update, completion endpoint,
  payload fields, validation limits, permissions, blockers, and dashboard
  redirect.
- The three visible steps are client-side progressive disclosure over the
  existing settings payload. Do not create a new backend onboarding state
  machine unless separately requested.
- Do not add billing or plan selection to standalone onboarding.
- Do not imply that completing setup confirms Meta/WhatsApp connectivity or
  activates test verification.

Objective:
Replace the long settings-like page with a focused three-step experience that
collects only the information needed at each moment, explains consequences in
plain language, and works intentionally in Arabic RTL and English LTR.

1. Focused onboarding shell
- While standalone onboarding is incomplete, show a focused authenticated shell
  instead of the protected application's full navigation/sidebar.
- Keep the Akeed logo, locale switcher, and Help entry in a slim top bar.
- Preserve AuthGuard and organization preparation. Do not weaken route access.
- Do not expose links to protected product areas that will immediately redirect
  back to incomplete onboarding.
- When setup is already complete, preserve the immediate dashboard redirect.
- Keep this shell decision isolated from embedded mode and other standalone
  protected routes.

2. Step navigation
- Present three localized steps:
  1. Store details — name, language, and source
  2. Confirmation rules — sending and follow-up behavior
  3. Review and complete — summary, blockers, and final action
- Desktop: show a vertical progress rail beside the main card as in the mockup.
- Mobile: replace it with a compact horizontal progress indicator and current
  step label.
- Mark completed steps separately from the active step.
- Users may return to completed earlier steps without losing values.
- Do not allow clicking ahead past an invalid current step.
- Keep step state client-side. A refresh may safely return to step one with the
  server-saved values unless an existing persistence contract supports more.

3. Step one — Store details
- Store name is required and uses the existing form.storeName value, validation,
  and OnboardingSettingsPayload.storeName field.
- Use the customer-facing labels “Store name” in English and “اسم المتجر” in
  Arabic. Replace the current Merchant name / اسم التاجر display copy.
- This value must continue to persist as the integration's store name and must
  remain the name used by customer-facing message previews/templates.
- A translation key may be renamed or replaced for clarity, but do not rename
  the API payload field or change its meaning.
- Present default message language as an accessible segmented control:
  Auto, Arabic, and English.
- Explain that Auto uses the customer's phone-country code.
- Show the source as a compact read-only status card using the existing source
  type and identity.
- Keep the long technical source identity collapsed by default behind Show ID.
- Show Copy ID only after the identity is revealed and preserve clipboard
  feedback.
- Keep the existing Treat missing payment information as COD option with clearer
  consequence-focused help text.
- Do not add store URL, industry, phone, address, or branding fields.

4. Step two — Confirmation rules
- Keep Enable automatic verification as the main controlling switch.
- Keep timezone visible because every timing rule depends on it.
- Organize existing automation settings into clear cards:
  - First-message delay
  - Follow-up message and delay
  - No-reply escalation and delay
  - Quiet hours, start, and end
- Disable dependent fields when their parent switch is off.
- Retain the existing ranges:
  - First-send delay: 0–24 hours
  - Follow-up delay: 0–168 hours
  - Escalation delay: 0–168 hours
- Preserve the rule that escalation must occur after the follow-up when both
  are enabled.
- Keep numeric and time values in the existing units expected by the hook and
  payload conversion.
- Advanced timing options may be collapsed initially, but enabled values must
  remain discoverable and summarized accurately.

5. Step three — Review and complete
- Show a concise read-only summary of store name, language, source type, COD
  fallback choice, automation status, timezone, and enabled timing rules.
- Provide Edit links that return to the relevant earlier step.
- Display backend blocked reasons using the existing typed reason vocabulary and
  localized messages.
- Do not hide blockers behind a generic error.
- Keep the existing notice that completion does not confirm Meta or WhatsApp
  connection and that test verification is enabled separately.
- Complete setup must first save the current valid payload, then call the
  existing completion endpoint, then redirect to the localized dashboard only
  after success.

6. Save behavior
- Primary step-one and step-two action: Save and continue.
- Secondary action: Save progress. It saves and remains on the current step; do
  not invent a Save and exit destination.
- Back does not discard unsaved local values.
- Disable relevant actions while saving or completing.
- Show saving, saved, failure, and completion states accurately.
- A failed save must preserve entered values and keep the user on the same step.
- Do not claim progress is saved until updateOnboardingSettings succeeds.
- Read-only users may inspect all steps but cannot modify, save, or complete.

7. Validation and focus
- Validate the fields relevant to the current step before advancing while
  preserving the full-payload rules required by the existing save endpoint.
- Keep all current validation limits and messages.
- Associate every error with its control and move focus to the first invalid
  field after an attempted advance/save.
- Announce page-level errors and success feedback with the appropriate live
  region semantics.
- Do not clear input after save or completion failures.

8. Loading and unavailable states
- Replace the generic full-page spinner with a skeleton matching the focused
  shell and onboarding card where practical.
- Preserve the distinct source-missing, source-inactive, source-ambiguous, and
  general unavailable messages.
- Keep Retry as the recovery action.
- Do not show an editable setup form when no valid onboarding state was loaded.

9. Locale alignment and direction
- Arabic: align every heading, label, placeholder, entered value, selected value,
  helper, validation error, alert, summary value, and action copy to the right.
- English: align all corresponding content to the left.
- Mirror the step rail, form columns, action placement, chevrons, and directional
  arrows with the locale.
- Technical source IDs, numeric hour values, time values, and Latin timezone
  identifiers retain LTR character ordering, but their containing field content
  still aligns to the locale edge.
- Do not rely only on inherited direction for inputs explicitly using dir=ltr;
  apply locale-aware text alignment separately.

10. Responsive behavior
- Desktop: progress card approximately 280 px and form card approximately
  700–740 px within a centered 1120 px layout.
- Tablet: reduce the progress rail width while retaining two columns when space
  allows.
- Mobile: one column, compact progress indicator above the form, stacked fields,
  and full-width primary action.
- Keep actions visible without a horizontal scroll and respect safe-area padding.
- Verify small-height viewports and 200% zoom.

Visual system:
- Use the shared standalone palette: warm off-white background, white cards,
  deep ink typography, emerald primary, soft-mint selection/information states,
  amber attention, and red only for errors.
- Use an 8 px spacing rhythm, 12–16 px radii, subtle neutral borders, restrained
  shadows, and 44–48 px controls.
- Avoid gradients, glassmorphism, a full application sidebar, marketing artwork,
  pricing content, and unnecessary decoration.

Acceptance criteria:
- Standalone onboarding is presented as three focused UI steps.
- The existing API payload and backend completion contract are unchanged.
- The UI says Store name / اسم المتجر and persists it through the existing
  storeName integration field.
- All existing settings remain available across the three steps.
- Save and continue never advances after a failed save.
- Save progress does not navigate to an invented destination.
- Blocked completion reasons remain visible and localized.
- Completed onboarding still redirects to the localized dashboard.
- Read-only and source-load error behavior remain correct.
- Every field and supporting message aligns right in Arabic and left in English.
- Technical/numeric character ordering remains correct in both locales.
- Embedded onboarding remains unchanged.

Validation:
npm --prefix akeed-frontend run build
npm --prefix akeed-frontend run lint
npm --prefix akeed-frontend exec tsc --noEmit
```
