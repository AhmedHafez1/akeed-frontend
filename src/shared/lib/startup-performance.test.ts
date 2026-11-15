import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isStartupPerformanceEnabled,
  measureStartup,
  observeStartupPerformance,
  reportShopifyVitals,
  sanitizedStartupPath,
  startStartupStage,
  markNavigationStart,
  parseServerTiming,
} from './startup-performance'

describe('opt-in startup diagnostics', () => {
  it('accepts only known finite numeric server timings', () => {
    expect(
      parseServerTiming([
        { name: 'auth', duration: 12, description: 'secret' },
        { name: 'dbq', duration: 3, description: '' },
        { name: 'private', duration: 100, description: 'secret' },
        { name: 'db', duration: '10', description: '' },
        { name: 'handler', duration: Infinity, description: '' },
      ] as unknown as PerformanceServerTiming[])
    ).toEqual({ auth: 12, dbq: 3 })
  })

  it('pairs sidebar starts with matching route commits and flushes final safe vitals', () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=1')
    const cleanup = observeStartupPerformance()
    markNavigationStart('/en/settings?token=secret')
    window.history.replaceState(null, '', '/en/settings?akeed_perf=1')
    window.dispatchEvent(new Event('akeed:performance-route'))
    const calls = vi.mocked(console.debug).mock.calls.map((call) => call[1])
    const start = calls.find((call) => call.metric === 'navigation-start')
    const end = calls.find((call) => call.metric === 'route-transition')
    expect(end).toMatchObject({
      navigationId: start.navigationId,
      path: '/en/settings',
    })
    reportShopifyVitals({ metrics: [{ name: 'LCP', value: 1200 }] })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(console.debug).toHaveBeenCalledWith(
      '[Akeed performance]',
      expect.objectContaining({
        metric: 'LCP',
        value: 1200,
        final: true,
        source: 'shopify',
      })
    )
    expect(JSON.stringify(vi.mocked(console.debug).mock.calls)).not.toContain(
      'secret'
    )
    cleanup()
  })
  beforeEach(() => {
    window.history.replaceState(null, '', '/ar/dashboard')
    vi.spyOn(console, 'debug').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('does no logging or observer work unless explicitly enabled', async () => {
    const observer = vi.fn()
    vi.stubGlobal('PerformanceObserver', observer)
    const cleanup = observeStartupPerformance()
    await measureStartup('session-token', () =>
      Promise.resolve('sensitive-token')
    )
    reportShopifyVitals({ metrics: [{ name: 'LCP', value: 14708 }] })
    cleanup()
    expect(isStartupPerformanceEnabled()).toBe(false)
    expect(observer).not.toHaveBeenCalled()
    expect(console.debug).not.toHaveBeenCalled()
  })

  it('whitelists fields, metrics, finite values and route names', async () => {
    window.history.replaceState(
      null,
      '',
      '/ar/billing/private-merchant-id?akeed_perf=1&token=secret&shop=private'
    )
    reportShopifyVitals({
      metrics: [
        { name: 'LCP', value: 123.456, token: 'secret-token' },
        { name: 'INP', value: Infinity },
        { name: 'private-shop', value: 123 },
      ],
      shopId: 'private-id',
    } as never)
    await measureStartup('session-token', () =>
      Promise.resolve('secret-result')
    )
    await expect(
      measureStartup('install-check', () =>
        Promise.reject(new Error('secret-error'))
      )
    ).rejects.toThrow('secret-error')
    const calls = JSON.stringify(vi.mocked(console.debug).mock.calls)
    expect(calls).not.toMatch(/secret|private|token=/)
    expect(calls).toContain('"path":"/ar/billing"')
    expect(vi.mocked(console.debug).mock.calls[0][1]).toMatchObject({
      metric: 'LCP',
      value: 123.46,
      source: 'shopify',
    })
    expect(console.debug).toHaveBeenCalledTimes(3)
    window.history.replaceState(null, '', '/unknown-user-id')
    expect(sanitizedStartupPath()).toBe('/other')
  })

  it('reports structural LCP attribution, document timings and route transitions without element content', async () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=1')
    const observers = new Map<
      string,
      (list: { getEntries: () => unknown[] }) => void
    >()
    const disconnect = vi.fn()
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) =>
      type === 'navigation'
        ? [
            {
              responseStart: 100,
              responseEnd: 140,
              domInteractive: 160,
              loadEventEnd: 180,
            } as PerformanceNavigationTiming,
          ]
        : [
            {
              name: 'https://private.example/private.js?token=secret',
              duration: 25,
            } as PerformanceEntry,
          ]
    )
    vi.stubGlobal(
      'PerformanceObserver',
      class {
        constructor(
          private callback: (list: { getEntries: () => unknown[] }) => void
        ) {}
        observe(options: { type: string }) {
          observers.set(options.type, this.callback)
        }
        disconnect = disconnect
      }
    )
    const cleanup = observeStartupPerformance()
    window.dispatchEvent(new Event('load'))
    await vi.waitFor(() =>
      expect(console.debug).toHaveBeenCalledWith(
        '[Akeed performance]',
        expect.objectContaining({ metric: 'html-download', value: 40 })
      )
    )
    document.body.innerHTML =
      '<main><h1 id="private-id" class="private-class">Private customer name</h1></main>'
    observers.get('largest-contentful-paint')!({
      getEntries: () => [
        { startTime: 500, element: document.querySelector('h1') },
      ],
    })
    observers.get('resource')!({
      getEntries: () => [
        {
          name: `${window.location.origin}/api/onboarding/state?shop=secret`,
          duration: 150,
          requestStart: 20,
          responseStart: 120,
          serverTiming: [{ name: 'dbq', duration: 4, description: 'secret' }],
        },
      ],
    })
    expect(console.debug).toHaveBeenCalledWith(
      '[Akeed performance]',
      expect.objectContaining({
        metric: 'api-request',
        path: '/api/onboarding/state',
        value: 150,
        ttfbMs: 100,
        serverTiming: { dbq: 4 },
      })
    )
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(console.debug).toHaveBeenCalledWith(
      '[Akeed performance]',
      expect.objectContaining({
        metric: 'LCP',
        value: 500,
        final: true,
        source: 'browser',
      })
    )
    window.history.replaceState(
      null,
      '',
      '/en/settings?akeed_perf=1&token=secret'
    )
    window.dispatchEvent(new Event('akeed:performance-route'))
    const calls = JSON.stringify(vi.mocked(console.debug).mock.calls)
    expect(calls).toContain('h1:nth-of-type(1)')
    expect(calls).toContain('route-transition')
    expect(calls).not.toMatch(/Private|private|secret/)
    cleanup()
    expect(disconnect).toHaveBeenCalledTimes(3)
  })

  it('keeps stage completion idempotent and respects disabling mid-operation', () => {
    window.history.replaceState(null, '', '/ar/dashboard?akeed_perf=1')
    const finish = startStartupStage('auth-gate')
    finish()
    finish()
    expect(console.debug).toHaveBeenCalledTimes(1)
    const other = startStartupStage('auth-gate')
    window.history.replaceState(null, '', '/ar/dashboard')
    other()
    expect(console.debug).toHaveBeenCalledTimes(1)
  })
})
