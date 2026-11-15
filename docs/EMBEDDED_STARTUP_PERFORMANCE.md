# Embedded startup performance

Append `akeed_perf=1` to an embedded app URL, preserving its existing Shopify parameters, to enable local diagnostics. Remove it to disable them. Native sidebar links preserve this flag only when enabled; they do not copy the other query parameters. The flag is not stored and no diagnostic endpoint or telemetry upload is added. Enable Debug/Verbose console messages and filter on `[Akeed performance]`.

## Reading the timings

- `navigation-to-response`, `html-download`, `dom-interactive`, and `document-complete` come from the browser navigation entry. `application-effect` is the first diagnostic React effect, an upper bound on initial application hydration rather than a precise hydration duration.
- `app-bridge`, `session-token`, `token-exchange`, `install-check`, `onboarding-request`, and `auth-gate` report operation durations in milliseconds. Cached operations need no new request. Onboarding retries produce a measurement for each attempt; backoff is included in the gate duration. Hook instances can report separate App Bridge waits.
- `dashboard-*-ready` values are elapsed milliseconds since document navigation, not request durations. They indicate when the relevant query first has usable data; normal polling and refresh behavior remain enabled.
- `resource-javascript`, `resource-css`, and `resource-font` describe individual resource durations without their URLs. `resources-*` are cumulative duration sums and counts at document load and route transitions. Requests overlap, so neither sums nor nested stage durations should be added to infer the critical path. Long tasks describe main-thread stalls without claiming which script caused them.
- `LCP` from `source: browser` includes a structural element locator using tags and sibling positions, without text, attributes, image URLs, or IDs. It can be found in the Elements panel. Candidate paints may be reported repeatedly. Browser timing starts at document navigation and need not restart during client navigation.
- Shopify's optional Web Vitals API reports `LCP`, `FCP`, `INP`, `TTFB` in milliseconds and unitless `CLS`, marked `source: shopify`. Reports can arrive later than the paint. Compare them with route-transition times and browser candidates rather than treating them as per-route measurements.

Every record includes its local emission time (`atMs`), a route with dynamic segments removed, and a public build SHA when available (`local` otherwise). Provider payloads, identities, tokens, query strings, response bodies, DOM text and element attributes are excluded. Browsers without the observer or optional Shopify API still load normally.

## Request reuse and isolation

The auth gate seeds the existing onboarding query with the full authenticated envelope before mounting dashboard consumers. Installation and onboarding checks share in-flight work for the current shop and host. Completed installation/onboarding status retains the existing five-minute lifetime; pending onboarding is not retained as a completed status. The dashboard retains its normal thirty-second freshness, focus refresh, invalidations and polling.

Context changes and explicit cache resets invalidate pending startup results. The gate clears the query client on a new embedded context before releasing protected content. The API transport also rejects responses that arrive after an embedded context switch. No credential renewal or install fallback is removed.

## Reproducible synthetic comparison

Run `node scripts/profile-embedded-startup.mjs 657feb04e5b058cc7e0a45b3f770baf5456ba9ea` from the frontend repository. It uses an installed Chromium browser (or `STARTUP_BROWSER_PATH`) without starting an HTTP server. Every browser request is intercepted; provider endpoints are never contacted.

The harness compares the real original/current auth gates and the real dashboard activation query. It supplies a twenty-millisecond token delay, eighty-millisecond install exchange and 120-millisecond onboarding response. It covers Arabic RTL and English LTR, root and direct dashboard entry, fresh browser contexts, reloads, and warm navigation, three times per combination. The full dashboard skin, real authentication, production delivery, and production bundle graph are outside this fixture.

Detailed samples and diagnostic events are written to `.tmp/startup-performance/browser-comparison.json`. Initial and reload readiness are measured separately. Raw browser traces are not saved, since they can contain request credentials.

The final local comparison on November 15, 2026 at 04:34 UTC used twelve original and twelve updated page visits, plus a reload and warm navigation for each. There were no browser errors and warm navigation added no onboarding reads.

| Median measurement | Original | Updated |
| --- | --- | --- |
| Onboarding reads before normal refresh | 2 | 1 |
| Data ready after first React effect | 373 ms | 267 ms |
| Reload data ready after first React effect | 372 ms | 252 ms |
| Navigation to data ready | 490 ms | 392 ms |
| Reload navigation to data ready | 477 ms | 480 ms |
| Final initial browser LCP candidate | 376 ms | 412 ms |

Representative updated initial-operation medians were 22 ms for token acquisition, 92 ms for the install exchange and 125 ms for onboarding. These fixture delays do not estimate production backend latency. Reload time before the first React effect varied enough to hide the eliminated request in the navigation-to-readiness median; the post-effect measure isolates the bootstrap work more closely.

The final synthetic LCP element was `html:nth-of-type(1)>body:nth-of-type(1)>div:nth-of-type(1)>main:nth-of-type(1)>h1:nth-of-type(1)`. The original LCP candidate preceded settled activation data, so that heading could still be its loading placeholder. Browser LCP did not establish an improvement even though data became available earlier. These unthrottled fixture measurements demonstrate request reduction and roughly one eliminated 120 ms wait; they do not prove the production LCP target or identify the real merchant's LCP element.

## Findings and remaining attribution

The original source makes two successful onboarding-state requests on a fresh normal dashboard visit: the auth gate reads it, then dashboard activation reads it again. The updated flow makes one. Warm navigation should add no onboarding requests within the existing freshness windows. A five-minute status cache never substitutes for fresh dashboard permissions or billing data.

Production HTML spot checks on November 15, 2026 returned headers in roughly 0.3–0.7 seconds. Synthetic embedded parameters produced approximately 381 KB of decoded HTML and 31 script references, with no server-rendered dashboard content. These unauthenticated HTML reads do not measure the authenticated API path or the merchant's network.

Rank further investigation in this order:

1. **Authenticated startup requests:** measure the token, exchange, onboarding attempts and gate duration in the real Shopify frame. Healthy installed stores already short-circuit the backend's provider exchange; credential recovery must remain intact. A long onboarding response needs backend stage attribution before proposing query changes.
2. **JavaScript, CSS and hydration:** correlate resource completion, long tasks, the first application effect and the actual LCP node. If transfer/evaluation dominates, inspect the production entry graph and defer unused modal/secondary-view modules. If hydration dominates, isolate the embedded route/shell rendering. Initial blank HTML alone does not prove either cause.
3. **Navigation and delivery:** compare root versus direct entry, redirect cost, regional TTFB and resource timings. The sampled fast HTML responses reduce suspicion for those particular requests but do not exclude cold or geographic latency.
4. **Metric attribution:** compare Shopify reports against browser candidate times and route transitions, especially when later navigation occurs. The synthetic fixture shows that data readiness can improve without a consistent LCP improvement; it does not establish a production metric defect.

No remaining category has a measured production contribution to the reported 14.7 seconds. Structural rendering, translation-payload changes, backend queries and provider lifecycle changes need that attribution first.

## Owner-operated Shopify check

Once this code is available in an owner-controlled deployment, enable the flag in the actual embedded app and preserve the console during navigation. For Arabic and English, compare root/direct entry with cold cache, warm reload and sidebar navigation. Record at least five comparable runs per scenario, using the same browser, viewport and network/CPU settings.

Save only the whitelisted diagnostic records. Record the final browser LCP candidate and its structural locator, Shopify's eventual report, each startup duration, and whether onboarding repeated before normal polling/focus refresh. A Performance panel recording can identify the loading/evaluation critical path locally; inspect/redact it before sharing because raw traces can contain authentication and merchant data. Do not copy the full iframe URL, request headers or response payloads into a report.

Report implementation, synthetic verification, deployment and live verification separately. This change is not deployed by the profiling script. Shopify's target is p75 LCP at most 2.5 seconds, INP at most 200 milliseconds and CLS at most 0.1 over the field evaluation window; a small local sample cannot establish that result. See [Shopify's performance guidance](https://shopify.dev/docs/apps/build/performance/admin-installation-oauth) and [Web Vitals API](https://shopify.dev/docs/api/app-home/latest/apis/device-and-platform-integration/web-vitals-api).


## Startup sequencing and request attribution

Embedded root requests (`/` or a locale root) with nonempty `shop` and `host` redirect on the server to the locale dashboard. If `embedded` is supplied it must equal `1`. Query parameters survive the redirect; ordinary website entry is unchanged. The dashboard gate still sends pending stores to onboarding, and the client landing gate remains a fallback.

After the App Bridge token is primed, onboarding starts alongside token exchange. The gate confirms installation before consuming the full onboarding response or populating its query cache. Fast speculative responses are retained until consumption, failed speculative reads can be retried after installation, and context changes abort obsolete transports and fence their late results. Dashboard destinations start confirmations and overview prefetches before rendering or redirecting. They use the mounted hooks' exact query options and 30-second provider freshness; normal focus and polling refreshes remain active. Embedded verification links preserve their query parameters while redirecting to confirmations.

Additional opt-in diagnostics:

| Metric | Meaning |
| --- | --- |
| `embedded-layout-ready` | The dynamically loaded embedded layout has mounted. |
| `navigation-start` | Sidebar pointer/keyboard activation; paired with `route-transition` using a numeric `navigationId`. A paired transition's value is elapsed milliseconds, while an unpaired initial transition remains navigation-relative. |
| `api-request` | One same-origin API resource: duration, `ttfbMs` (responseStart minus requestStart), allowlisted route and numeric `serverTiming` values. Unknown API routes become `/api/other`; query strings, identifiers and timing descriptions are omitted. |
| `dashboard-confirmations-painted` | A frame-scheduled marker after successful confirmations content commits, separate from the query-success marker. It is an approximation of paint opportunity, not a field Web Vital. |
| Vital with `final: true` | The last browser LCP candidate/structural locator and latest supplied Shopify vitals, flushed when the document becomes hidden. Missing Shopify reports stay missing. |

Backend `Server-Timing` fields are `auth`, `handler`, `total`, `db`, `dbmax`, `dbq` and `dbconn`. All values are numeric; `dbq` and `dbconn` are counts despite the header's `dur` syntax. Summed database time overlaps concurrent work and must not be added to total request time. Connection counts describe generations first observed during each request's window, including reconnects; overlapping requests can share that observation.

Keep readiness targets separate from Shopify's rolling 28-day field report: cold dashboard readiness p75 at most 2.5 seconds, warm reload at most 1.5 seconds, paired cached navigation at most 200 ms; field LCP at most 2.5 seconds, INP at most 200 ms and CLS at most 0.1. Compare at least five equivalent cold, warm-reload and sidebar runs in English and Arabic, report sample counts, and retain the final LCP locator. Match the capture window to backend onboarding/list/overview and boot-probe logs. Single runs and synthetic fixture improvements do not establish production targets.

The server-free profiler now mounts real confirmations/overview query options alongside activation and records request starts. Its baseline comparison substitutes the baseline gate/auth helpers only; it does not reproduce Next.js server proxy/RSC/chunk latency, real Shopify framing or backend network distance. The locale-root proxy behavior is covered separately by routing tests. Output is stored as `.tmp/startup-performance/round2-browser-comparison.json`.
