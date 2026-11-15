// A server-free browser comparison of the real auth gate and activation query.
// All network requests are intercepted; only synthetic fixtures are admitted.
// Usage: node scripts/profile-embedded-startup.mjs [baseline git ref]
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baseline = process.argv[2] ?? 'HEAD'
const snapshots = new Map(
  [
    'src/shared/auth/EmbeddedAuthGate.tsx',
    'src/features/onboarding/lib/embeddedAuth.ts',
  ].map((file) => [
    path.join(root, file),
    execFileSync('git', ['show', `${baseline}:${file}`], {
      cwd: root,
      encoding: 'utf8',
    }),
  ])
)
const stubs = {
  'next/navigation': `
    import {useSyncExternalStore} from 'react';
    const subscribe=cb=>{window.addEventListener('fixture-route',cb);return()=>window.removeEventListener('fixture-route',cb)};
    const url=()=>location.pathname+location.search;
    const router={replace:to=>{history.replaceState(null,'',to);window.dispatchEvent(new Event('fixture-route'))}};
    export const useRouter=()=>router;
    export const usePathname=()=>{useSyncExternalStore(subscribe,url);return location.pathname};
    export const useSearchParams=()=>{useSyncExternalStore(subscribe,url);return new URLSearchParams(location.search)};
  `,
  '@/shared/hooks/useAkeedMode': `
    import {useSearchParams} from 'next/navigation';
    export const useAkeedMode=()=>{const p=useSearchParams();return {isEmbedded:true,isLoading:false,shopDomain:p.get('shop'),hostParam:p.get('host'),shopify:window.fixture.bridge}};
  `,
  '@/shared/hooks/useAppBridgeLoading':
    'export const useAppBridgeLoading=()=>{};',
  '@/shared/lib/auth': `
    export const primeShopifySessionToken=()=>{};
    export const api={get:()=>window.fixture.readState('activation')};
  `,
  '@/features/onboarding/api/onboardingApi': `
    export const fetchOnboardingState=()=>window.fixture.readState('gate');
    export class OnboardingApiError extends Error {}
  `,
}
const entry = `
  import React, {useEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {QueryClient,QueryClientProvider,useQuery} from '@tanstack/react-query';
  import {EmbeddedAuthGate} from '@/shared/auth/EmbeddedAuthGate';
  import {activationStateOptions} from '@/features/dashboard/api/activationQueries';
  import {usePathname,useRouter} from 'next/navigation';
  import {useAkeedMode} from '@/shared/hooks/useAkeedMode';
  import {useStartupPerformance,useStartupReady} from '@/shared/hooks/useStartupPerformance';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const state={state:{onboardingStatus:'completed',permissions:{canUpdateConfiguration:false}}};
  window.fixture={reads:{gate:0,activation:0,exchange:0,token:0},errors:[],ready:[],
    bridge:{idToken:async()=>{window.fixture.reads.token++;await sleep(20);return 'synthetic-only'},loading:()=>{},webVitals:{onReport:async()=>{}}},
    readState:async kind=>{window.fixture.reads[kind]++;await sleep(120);return state}};
  window.fetch=async()=>{window.fixture.reads.exchange++;await sleep(80);return new Response(JSON.stringify({installed:true}),{headers:{'Content-Type':'application/json'}})};
  window.addEventListener('error',e=>window.fixture.errors.push(e.message));
  function Activation(){
    const query=useQuery(activationStateOptions());
    useStartupReady('dashboard-activation-ready',query.isSuccess);
    useEffect(()=>{if(query.isSuccess)window.fixture.ready.push(performance.now())},[query.isSuccess]);
    return <main><h1>{query.isSuccess?'Synthetic dashboard ready':'Loading activation'}</h1></main>;
  }
  function App(){
    useStartupPerformance(useAkeedMode());
    const pathname=usePathname();const router=useRouter();
    return <><button onClick={()=>router.replace(location.pathname+location.search+'&tab=metrics')}>Navigate</button>
      <EmbeddedAuthGate onboardingGate={pathname.endsWith('dashboard')?'dashboard':'landing'}><Activation/></EmbeddedAuthGate></>;
  }
  const client=new QueryClient({defaultOptions:{queries:{staleTime:30000,retry:false,refetchOnWindowFocus:false}}});
  createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><App/></QueryClientProvider>);
`

async function bundle(before) {
  const result = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'tsx' },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA': '"synthetic"',
    },
    plugins: [
      {
        name: 'synthetic-only',
        setup(build) {
          build.onResolve({ filter: /^(next\/navigation|@\/)/ }, (args) => {
            if (stubs[args.path])
              return { path: args.path, namespace: 'fixture' }
            if (args.path === '@/features/onboarding')
              return {
                path: path.join(
                  root,
                  'src/features/onboarding/lib/embeddedAuth.ts'
                ),
              }
            if (args.path.startsWith('@/')) {
              const base = path.join(root, 'src', args.path.slice(2))
              const resolved = ['.ts', '.tsx', '/index.ts']
                .map((ext) => base + ext)
                .find(existsSync)
              if (resolved) return { path: resolved }
            }
          })
          build.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
            contents: stubs[args.path],
            loader: 'js',
            resolveDir: root,
          }))
          if (before)
            build.onLoad({ filter: /\.(ts|tsx)$/ }, (args) =>
              snapshots.has(args.path)
                ? {
                    contents: snapshots.get(args.path),
                    loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
                  }
                : undefined
            )
        },
      },
    ],
  })
  return result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')
}

const executablePath = [
  process.env.STARTUP_BROWSER_PATH,
  chromium.executablePath(),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((candidate) => candidate && existsSync(candidate))
if (!executablePath)
  throw new Error(
    'No Chromium browser found. Set STARTUP_BROWSER_PATH to a local browser executable.'
  )
const bundles = { before: await bundle(true), after: await bundle(false) }
const browser = await chromium.launch({ executablePath, headless: true })
const results = []
try {
  for (const version of ['before', 'after']) {
    for (const locale of ['ar', 'en']) {
      for (const entryRoute of ['root', 'direct']) {
        for (let run = 0; run < 3; run++) {
          const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
          })
          const page = await context.newPage()
          const diagnostics = []
          let phase = 'initial'
          const errors = []
          page.on('console', (message) => {
            if (
              message.type() === 'debug' &&
              message.text().startsWith('[Akeed performance]')
            ) {
              const capturedPhase = phase
              diagnostics.push(
                message
                  .args()[1]
                  .jsonValue()
                  .then((data) => ({ phase: capturedPhase, ...data }))
              )
            }
          })
          page.on('pageerror', (error) => errors.push(error.message))
          await page.route('**/*', (route) => {
            if (
              route.request().resourceType() !== 'document' ||
              new URL(route.request().url()).hostname !== 'startup.test'
            )
              return route.abort()
            return route.fulfill({
              contentType: 'text/html',
              body: `<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><body><div id="root"></div><script>${bundles[version]}</script></body></html>`,
            })
          })
          const route =
            entryRoute === 'root' ? `/${locale}` : `/${locale}/dashboard`
          await page.goto(
            `http://startup.test${route}?shop=synthetic.myshopify.com&host=synthetic&akeed_perf=1`
          )
          await page
            .getByRole('heading', { name: 'Synthetic dashboard ready' })
            .waitFor()
          // Capture LCP before trusted sidebar input ends the browser's observation.
          await page.waitForTimeout(80)
          const initial = await page.evaluate(() => ({
            ...window.fixture.reads,
            readyAt: window.fixture.ready[0],
          }))
          phase = 'warm-navigation'
          await page.getByRole('button', { name: 'Navigate' }).click()
          await page.waitForTimeout(100)
          const warm = await page.evaluate(() => ({ ...window.fixture.reads }))
          phase = 'reload'
          await page.reload()
          await page
            .getByRole('heading', { name: 'Synthetic dashboard ready' })
            .waitFor()
          await page.waitForTimeout(80)
          const reload = await page.evaluate(() => ({
            ...window.fixture.reads,
            readyAt: window.fixture.ready[0],
          }))
          results.push({
            version,
            locale,
            entry: entryRoute,
            run,
            initial,
            warmNavigation: warm,
            reload,
            diagnostics: await Promise.all(diagnostics),
            errors,
          })
          await context.close()
        }
      }
    }
  }
} finally {
  await browser.close()
}
const output = path.join(root, '.tmp/startup-performance')
mkdirSync(output, { recursive: true })
const report = {
  observedAt: new Date().toISOString(),
  baseline,
  synthetic: true,
  fixtureDelaysMs: { token: 20, exchange: 80, onboarding: 120 },
  results,
}
writeFileSync(
  path.join(output, 'browser-comparison.json'),
  JSON.stringify(report, null, 2) + '\n'
)
for (const version of ['before', 'after']) {
  const runs = results.filter((result) => result.version === version)
  const median = (values) =>
    values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
  console.log(
    JSON.stringify({
      version,
      runs: runs.length,
      medianReadyMs: Math.round(median(runs.map((run) => run.initial.readyAt))),
      medianReloadMs: Math.round(median(runs.map((run) => run.reload.readyAt))),
      onboardingReads: [
        ...new Set(
          runs.map((run) => run.initial.gate + run.initial.activation)
        ),
      ],
      unexpectedWarmReads: runs.filter(
        (run) =>
          run.warmNavigation.gate + run.warmNavigation.activation !==
          run.initial.gate + run.initial.activation
      ).length,
      errors: runs.flatMap((run) => run.errors),
    })
  )
}
console.log(path.join(output, 'browser-comparison.json'))
if (results.some((result) => result.errors.length || !result.initial.readyAt))
  process.exitCode = 1
