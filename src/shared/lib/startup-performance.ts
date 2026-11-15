'use client'

type StartupStage =
  | 'embedded-layout-ready'
  | 'dashboard-confirmations-painted'
  | 'application-effect'
  | 'app-bridge'
  | 'session-token'
  | 'token-exchange'
  | 'install-check'
  | 'onboarding-request'
  | 'auth-gate'
  | 'dashboard-confirmations-ready'
  | 'dashboard-stats-ready'
  | 'dashboard-overview-ready'
  | 'dashboard-activation-ready'

const latestShopifyVitals = new Map<string, number>()
let pendingNavigation: { at: number; path: string; id: number } | null = null
let navigationSequence = 0
const SERVER_TIMINGS = new Set([
  'auth',
  'handler',
  'total',
  'db',
  'dbmax',
  'dbq',
  'dbconn',
])
const API_ROUTES = new Set([
  '/api/auth/shopify/token-exchange',
  '/api/auth/shopify/check',
  '/api/onboarding/state',
  '/api/verifications',
  '/api/verifications/overview',
  '/api/verifications/stats',
  '/api/whatsapp-sender',
  '/api/whatsapp-sender/connection',
  '/api/tips',
  '/api/review-prompt',
])

export function parseServerTiming(
  entries: readonly PerformanceServerTiming[] = []
): Record<string, number> {
  return Object.fromEntries(
    entries
      .filter(
        (entry) =>
          SERVER_TIMINGS.has(entry.name) &&
          typeof entry.duration === 'number' &&
          Number.isFinite(entry.duration) &&
          entry.duration >= 0
      )
      .map((entry) => [entry.name, entry.duration])
  )
}

/** Pair a sidebar activation with the next matching route commit. */
export function markNavigationStart(path: string): void {
  if (!isStartupPerformanceEnabled()) return
  const target = new URL(path, window.location.origin)
  if (target.origin !== window.location.origin) return
  const safe = target.pathname.match(
    /^\/(ar|en|ur|es|fr|tr)\/(dashboard|settings)$/
  )?.[0]
  if (!safe) return
  pendingNavigation = {
    at: performance.now(),
    path: safe,
    id: ++navigationSequence,
  }
  emit('navigation-start', pendingNavigation.at, {
    path: safe,
    navigationId: pendingNavigation.id,
  })
}

const VITALS = new Set(['LCP', 'FCP', 'CLS', 'INP', 'TTFB'])
const ROUTES = new Set([
  'dashboard',
  'verifications',
  'onboarding',
  'settings',
  'billing',
  'automation-settings',
  'message-preview',
  'templates',
])
const TAGS = new Set([
  'html',
  'body',
  'main',
  'section',
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'img',
  'svg',
  'table',
  'tbody',
  'tr',
  'td',
  'th',
  'button',
])
const build = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
const BUILD = build && /^[a-f0-9]{7,40}$/i.test(build) ? build : 'local'

/** This flag is deliberately neither persisted nor sent to a telemetry service. */
export function isStartupPerformanceEnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('akeed_perf') === '1'
  )
}

export function sanitizedStartupPath(): string {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const locale = /^(ar|en|ur|es|fr|tr)$/.test(parts[0] ?? '')
    ? parts.shift()
    : null
  const route =
    parts.length === 0 ? '' : ROUTES.has(parts[0]) ? parts[0] : 'other'
  return `/${locale ? `${locale}/` : ''}${route}`.replace(/\/$/, '') || '/'
}

function emit(
  metric: string,
  value: number,
  extra: {
    element?: string
    count?: number
    source?: 'browser' | 'shopify'
    outcome?: 'success' | 'failure'
    path?: string
    final?: boolean
    navigationId?: number
    ttfbMs?: number
    serverTiming?: Record<string, number>
  } = {}
) {
  if (!isStartupPerformanceEnabled() || !Number.isFinite(value) || value < 0)
    return
  // Never spread a provider payload or a PerformanceEntry into diagnostics.
  console.debug('[Akeed performance]', {
    metric,
    value: Math.round(value * 100) / 100,
    atMs: Math.round(performance.now()),
    path: extra.path ?? sanitizedStartupPath(),
    build: BUILD,
    ...(extra.final ? { final: true } : {}),
    ...(extra.navigationId !== undefined
      ? { navigationId: extra.navigationId }
      : {}),
    ...(extra.ttfbMs !== undefined &&
    Number.isFinite(extra.ttfbMs) &&
    extra.ttfbMs >= 0
      ? { ttfbMs: extra.ttfbMs }
      : {}),
    ...(extra.serverTiming ? { serverTiming: extra.serverTiming } : {}),
    ...(extra.element ? { element: extra.element } : {}),
    ...(extra.count !== undefined ? { count: extra.count } : {}),
    ...(extra.source ? { source: extra.source } : {}),
    ...(extra.outcome ? { outcome: extra.outcome } : {}),
  })
}

export function startStartupStage(
  stage: StartupStage
): (success?: boolean) => void {
  if (!isStartupPerformanceEnabled()) return () => undefined
  const start = performance.now()
  let finished = false
  return (success = true) => {
    if (finished) return
    finished = true
    emit(stage, performance.now() - start, {
      outcome: success ? 'success' : 'failure',
    })
  }
}

export async function measureStartup<T>(
  stage: StartupStage,
  run: () => Promise<T>,
  succeeded: (result: T) => boolean = () => true
): Promise<T> {
  const finish = startStartupStage(stage)
  try {
    const result = await run()
    finish(succeeded(result))
    return result
  } catch (error) {
    finish(false)
    throw error
  }
}

export function markStartupReady(stage: StartupStage): void {
  emit(stage, performance.now())
}

/** A structural locator identifies the painted node without text, IDs or classes. */
function elementLocator(element: Element | null): string {
  const parts: string[] = []
  for (
    let node = element;
    node && parts.length < 6;
    node = node.parentElement
  ) {
    const tag = node.tagName.toLowerCase()
    const position = node.parentElement
      ? [...node.parentElement.children]
          .filter((child) => child.tagName === node!.tagName)
          .indexOf(node) + 1
      : 1
    parts.unshift(`${TAGS.has(tag) ? tag : '*'}:nth-of-type(${position})`)
  }
  return parts.join('>')
}

/** Mount once per app. All observers are optional and read only local timing data. */
export function observeStartupPerformance(): () => void {
  if (!isStartupPerformanceEnabled()) return () => undefined
  latestShopifyVitals.clear()
  let latestLcp: { value: number; element: string; path?: string } | undefined
  const observers: PerformanceObserver[] = []
  const flushers: (() => void)[] = []
  const routes = [{ at: 0, path: sanitizedStartupPath() }]
  const categoryOf = (entry: PerformanceEntry) => {
    try {
      const path = new URL(entry.name).pathname
      return /\.m?js$/.test(path)
        ? 'javascript'
        : /\.css$/.test(path)
          ? 'css'
          : /\.(woff2?|ttf)$/.test(path)
            ? 'font'
            : null
    } catch {
      return null
    }
  }
  const observe = (
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ) => {
    try {
      const observer = new PerformanceObserver((list) =>
        callback(list.getEntries())
      )
      observer.observe({ type, buffered: true })
      observers.push(observer)
      flushers.push(() => {
        const pending = observer.takeRecords?.()
        if (pending?.length) callback(pending)
      })
    } catch {
      /* Older browsers may not implement every performance entry type. */
    }
  }
  const documentTiming = () => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    if (!nav) return
    emit('navigation-to-response', nav.responseStart)
    emit('html-download', nav.responseEnd - nav.responseStart)
    emit('dom-interactive', nav.domInteractive)
    emit('document-complete', nav.loadEventEnd)
  }
  const resources = () => {
    const totals = new Map<string, { duration: number; count: number }>()
    for (const entry of performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[]) {
      const category = categoryOf(entry)
      if (!category) continue
      const total = totals.get(category) ?? { duration: 0, count: 0 }
      total.duration += entry.duration
      total.count++
      totals.set(category, total)
    }
    for (const [category, total] of totals)
      emit(`resources-${category}`, total.duration, { count: total.count })
  }
  const reportDocument = () => {
    documentTiming()
    resources()
  }
  // loadEventEnd is set only after load handlers return.
  const onLoad = () => {
    timer = window.setTimeout(reportDocument, 0)
  }
  let timer: number | undefined
  if (document.readyState === 'complete') onLoad()
  else window.addEventListener('load', onLoad, { once: true })
  markStartupReady('application-effect')
  observe('largest-contentful-paint', (entries) => {
    for (const entry of entries) {
      const lcp = entry as PerformanceEntry & {
        element?: Element
        renderTime?: number
        loadTime?: number
      }
      const route = routes.findLast(
        (route) => route.at <= entry.startTime
      )?.path
      latestLcp = {
        value: entry.startTime,
        element: elementLocator(lcp.element ?? null),
        path: route,
      }
      emit('LCP', entry.startTime, {
        source: 'browser',
        element: elementLocator(lcp.element ?? null),
        path: route,
      })
    }
  })
  observe('longtask', (entries) => {
    for (const entry of entries) emit('long-task', entry.duration)
  })
  observe('resource', (entries) => {
    for (const entry of entries) {
      const category = categoryOf(entry)
      if (category) emit(`resource-${category}`, entry.duration)
      const resource = entry as PerformanceResourceTiming
      try {
        const url = new URL(entry.name)
        if (
          url.origin === window.location.origin &&
          url.pathname.startsWith('/api/')
        ) {
          emit('api-request', resource.duration, {
            path: API_ROUTES.has(url.pathname) ? url.pathname : '/api/other',
            ttfbMs: resource.responseStart - resource.requestStart,
            serverTiming: parseServerTiming(resource.serverTiming),
          })
        }
      } catch {
        /* Non-URL entries carry no request attribution. */
      }
    }
  })
  const onRoute = () => {
    routes.push({ at: performance.now(), path: sanitizedStartupPath() })
    const navigation = pendingNavigation
    const matches = navigation?.path === sanitizedStartupPath()
    emit(
      'route-transition',
      matches ? performance.now() - navigation.at : performance.now(),
      {
        ...(matches ? { navigationId: navigation.id } : {}),
      }
    )
    pendingNavigation = null
    resources()
  }
  const onHidden = () => {
    if (document.visibilityState !== 'hidden') return
    flushers.forEach((flush) => flush())
    if (latestLcp)
      emit('LCP', latestLcp.value, {
        source: 'browser',
        element: latestLcp.element,
        path: latestLcp.path,
        final: true,
      })
    for (const [name, value] of latestShopifyVitals)
      emit(name, value, { source: 'shopify', final: true })
  }
  document.addEventListener('visibilitychange', onHidden)
  window.addEventListener('akeed:performance-route', onRoute)
  return () => {
    observers.forEach((observer) => observer.disconnect())
    document.removeEventListener('visibilitychange', onHidden)
    pendingNavigation = null
    latestShopifyVitals.clear()
    window.removeEventListener('load', onLoad)
    window.removeEventListener('akeed:performance-route', onRoute)
    window.clearTimeout(timer)
  }
}

export function reportShopifyVitals(report: {
  metrics: { name: string; value: number }[]
}): void {
  if (!isStartupPerformanceEnabled() || !Array.isArray(report?.metrics)) return
  for (const metric of report.metrics) {
    if (
      metric &&
      VITALS.has(metric.name) &&
      Number.isFinite(metric.value) &&
      metric.value >= 0
    ) {
      latestShopifyVitals.set(metric.name, metric.value)
      emit(metric.name, metric.value, { source: 'shopify' })
    }
  }
}

export type { StartupStage }
