# Change-request browser verification

This record accompanies the cross-platform backend verification. The starting frontend snapshot was `2de7592f5db53a63aa163133d4b9b38a46dcead2`; results apply to the verification changes in the commit containing this record. Full operational rollout/rollback and the D01–D24 matrix live in the backend repository's `docs/CHANGE_REQUEST_RELEASE_RUNBOOK.md` and `test/release-evidence/change-requests.md`.

## Reproduce

From this repository, run `npm run e2e:change-requests`. It uses `playwright.change-requests.config.ts`, starts only the authorized synthetic smoke app on loopback port 3098 (the integrated run uses isolated port 3097 and a separate cache), and writes screenshots/traces/results under `.tmp/cr05-playwright/`. Each test receives a fresh browser context; no real sign-in, provider operation or owner browser preferences are changed.

For the integrated browser/API case, run `pwsh -NoProfile -File scripts/test-change-request-release-contract.ps1 -Browser` from the sibling backend. That runner creates disposable PostgreSQL, starts the real guarded API with fake external identity/provider boundaries, captures an actual request, and supplies only its own loopback API URL to Playwright. The production change-request panel reads and resolves that persisted request. The backend then independently asserts the persisted merchant resolution.

The test-only fixture API module is used instead of production token acquisition. For `scenario=integrated`, verification GET/POST calls go through a loopback-only same-origin rewrite to the actual backend with a synthetic token. Real backend authorization and tenant/role checks remain active. This does not prove production Supabase authentication or Shopify App Bridge/Admin framing. Fixture-only scenarios stay entirely synthetic and make no backend/provider claim.

## Coverage

- Both production skins in English, Arabic, Urdu, Spanish, French and Turkish; Arabic/Urdu mobile RTL at 390 pixels, other locales at 1440 pixels.
- Contact links, copy control, do-not-ship guidance, email failure warning, resolution controls, page direction, no page-level horizontal overflow and uncaught browser errors.
- Standalone dark theme rendering in addition to light-mode assertions; embedded remains light. Screenshot review includes Arabic/Urdu mobile layouts. Typography checks do not establish native translation fluency.
- Empty/error states, viewer controls absent while request guidance remains, and stale customer-first resolution refresh.
- Settings readiness: default-off ready control and disabled unavailable control.
- Representative real API case: standalone/shared sender, accepted initial dispatch and signed request capture in the backend, real list/panel response, merchant confirmation through the guarded API, persisted resolution. All other source/sender combinations are covered through backend HTTP/adapter contracts, not claimed as browser flows.

**Final browser results: 20 fixture checks and one integrated browser/API case passed.** Exact source/check fingerprints are recorded in the backend's machine-readable release summary. Initial harness failures (incorrect selector keys, an expectation of disabled rather than intentionally hidden viewer actions, an assumption that queued resends disable merchant confirmation, and the Next/Playwright test-environment startup issues) remain in local diagnostic logs; only completed final runs count as passing evidence.

## Application checks and limitations

- Full Vitest baseline: 193 test files / 2,328 tests passed. Verification changes touch test tooling only; production components and business contracts remain unchanged.
- `npm run lint` and `npm run build`: passed.
- Standard `npx tsc --noEmit`: **failed**, reproduced before edits and again after the production build. Three generated `.next/types/validator.ts` TS2344 errors combine fixture/root route declarations and disagree on `LayoutProps` for `/[locale]/admin`. Do not report this command as passing.
- A separate TypeScript API check excluding generated Next caches and `next-env.d.ts` checked 978 application/test roots with zero errors. This supplements the passing build; it does not replace or turn the standard typecheck green.
- No deployment, production migration, activation, real notifications, live template approval, native proofreading or actual Shopify Admin session was performed. Screenshots confirm fixture rendering, not real store data or live-provider behavior. Settings fixture logs include existing missing logo-image warnings; no new feature-page uncaught runtime error was observed.

Production release readiness remains conditional on resolving/accepting the recorded broader-check limitations through the normal release process and verifying real templates, infrastructure and smoke procedures. Disabling future feature selection must retain handlers and UI for already-sent buttons and open requests.

## Exact supplemental application typecheck

Run in PowerShell from the frontend root. The failed standard command remains a separate result.

```powershell
@'
const ts=require('typescript');
const cfg=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(cfg.config,ts.sys,process.cwd());
const roots=parsed.fileNames.filter(f=>!/[\\/]\.next[^\\/]*[\\/]/.test(f)&&!f.endsWith('next-env.d.ts'));
const program=ts.createProgram(roots,{...parsed.options,incremental:false});
const errors=ts.getPreEmitDiagnostics(program);
console.log(ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));
console.log(JSON.stringify({rootFiles:roots.length,errors:errors.length}));
process.exitCode=errors.length?1:0;
'@ | node
```
