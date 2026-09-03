# E01 isolated cancellation feedback fixture

Run `npm run smoke:e01` from the frontend repository with its existing dependencies. Open `http://127.0.0.1:3098/en` or `/ar` in the browser. Stop this process when finished; do not stop the owner's application servers.

This separate Next.js test application imports the real embedded `useMainConfirmationsTab`, standalone `useDashboard`, data hooks and both verification table components. Its Webpack configuration replaces only the authentication/API module with a strict in-memory fixture. No production route, authentication code or service response is changed. It does not load the application's `.env.local`, uses no provider credentials and binds only to loopback. Its CSP blocks external connections, forms and frames. Unexpected API operations throw, including the send-test endpoint; there is no network fallback.

The fixture is **not authentication evidence**. Check the real Shopify session, real standalone session and organization bootstrap, onboarding, full layouts, settings, navigation and billing visibility separately in the authenticated development apps. The single backend evidence record is `akeed-backend/docs/E01-BASELINE-EVIDENCE.md` in the workspace.

For each locale and both **Fixture skin** choices:

1. Reload for a fresh synthetic `no_reply` order. Inspect call counts: no cancellation has been submitted.
2. Click the row's localized cancel button, verify the confirmation text, then keep the order. The row must remain unchanged and cancellation count remain zero.
3. Request cancellation again and confirm with **Fixture result = Failure**. Before resolving, both row action buttons must be disabled and the loading label/spinner visible. Inspect counts to confirm one pending call.
4. Click **Resolve pending fixture request**. Verify the localized error, retained order and enabled retry controls; no list/stats refresh should occur for a rejected cancellation.
5. Choose **Success**, retry confirmation, inspect disabled/loading state, then resolve. Verify the row becomes canceled, cancellation controls disappear, and the list GET count increases. The standalone hook also refreshes statistics; the embedded confirmations hook only refreshes its list. Preserve this distinction. The returned synthetic `providerOperationId` is only a reference; no remote cancellation is performed or proved.
6. Repeat the sequence for reproducibility. Only change fixture controls; never reproduce these destructive clicks against the live application.

The fixture controls are deliberately labeled in English in both locales so the operator can distinguish them from the real localized application controls. They are test tooling outside the shipped route tree. Inspect the DOM's `lang`/`dir` and the actual translated confirmation/error messages; full visual layout acceptance belongs to the authenticated application smoke checks.

`browser-check.mjs` exports `checkCancellation(tab, skin, locale)` for the documented browser-control Tab API (`skin`: `embedded` or `standalone`; `locale`: `en` or `ar`). It refuses any tab outside the exact loopback fixture origin. After the page has loaded, run one sequence per call with a 55-second tool timeout, then reload before the next sequence. This helper does not launch browsers or require Playwright installation; the steps above remain the manual equivalent.

Check the fixture's own project with `npx --no-install tsc --noEmit --incremental false -p test/e01-smoke/tsconfig.json` from the frontend root. The normal root lint command also checks its source; generated fixture output is excluded from root lint/type inputs.

For the E02 release gate, `npm run smoke:e02:typecheck` compiles the same fixture against the production neutral cancellation and billing response types, and `npm run smoke:e02` starts it. Exercise both `skin=embedded` and `skin=standalone`; shell mode must not change provider capability or billing entitlement behavior.

Validation: run frontend TypeScript/build/non-fixing lint and the documented backend gate. Use a separate `NEXT_DIST_DIR` for a production validation build while the owner's two development servers run, to avoid deleting their generated chunks. Do not count missing infrastructure, fixture setup errors, or failed smoke actions as passes.

US-02-03 extends the fixture with per-order capabilities and a neutral pending-operation result. After the order row loads, choose **Unsupported** in **Fixture capability**: both skins must show the translated unavailable message with no cancellation button. Choose **Legacy response**: the cancellation controls remain compatible with the old response. In both languages, successful cancellation must show the translated pending-provider message after refresh. Enter activates the native confirmation/dismiss controls. The fixture still does not prove authenticated full-layout styling or remote completion.

## US-02-04 billing fixture

Open `http://127.0.0.1:3098/en/billing?entitlement=manual&skin=standalone`. Use `/ar/billing` for Arabic. This route imports the real `useSettings` hook and Standalone/embedded tabbed skins. The layout supplies a synthetic no-op App Bridge `loading` method; there are no session tokens or real authentication. All API operations remain intercepted, with unexpected requests rejected.

Use `skin=embedded&tab=billing&shop=synthetic.myshopify.com&host=c3ludGhldGljLm15c2hvcGlmeS5jb20vYWRtaW4%3D` to exercise embedded mode. The `entitlement` parameter independently selects `manual`, `shopify`, `blocked`, or `missing`; shell mode does not choose the billing provider.

For each locale and shell:

1. Wait for **Billing fixture state** to report `ready:true`. For `manual`, verify the translated pilot status, Starter plan, 30/30 quota, and support message. There must be no plan-purchase controls.
2. Click **Select upgrade through hook**, then **Invoke billing handler**. Verify `selectedPlanId` remains `starter`, `canManageBilling:false`, and `billingPosts:0`. These English-labeled buttons are test tooling outside the shipped application.
3. Repeat with `entitlement=missing` and `entitlement=blocked`. Missing capability deliberately includes stale plan data; it must still expose no purchase controls. Blocked status must remain visible.
4. With `entitlement=shopify`, verify four existing plans and `canManageBilling:true`, select Pro, and use the translated plan-change button. The real hook redirects to the same loopback page with `approved=1`; this is a synthetic confirmation destination, not a subscription purchase. The embedded Billing tab also adds `tab=billing` to the URL. Do not test these actions against a live merchant.
5. Confirm native Enter-key plan selection and Arabic `lang=ar`/`dir=rtl`. **Inspect billing calls** refreshes counters without changing application state.

The fixture does not simulate onboarding activation or staff provisioning. Its template previews are synthetic. Authenticated layout, live Shopify approval, and staff/audit validation remain separate release gates. See `akeed-backend/docs/US-02-04-PROVIDER-NEUTRAL-ENTITLEMENTS-EVIDENCE.md` for dated results and the unrun PostgreSQL gate.
