'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ShopifyGlobal } from '@/shared/types/window.model'
import {
  isStartupPerformanceEnabled,
  markStartupReady,
  observeStartupPerformance,
  reportShopifyVitals,
  type StartupStage,
} from '@/shared/lib/startup-performance'

export function useStartupPerformance({
  isEmbedded,
  shopify,
}: {
  isEmbedded: boolean
  shopify: Pick<ShopifyGlobal, 'webVitals'> | null
}) {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const enabled =
    isEmbedded && new URLSearchParams(search).get('akeed_perf') === '1'
  useEffect(
    () => (enabled ? observeStartupPerformance() : undefined),
    [enabled]
  )
  useEffect(() => {
    if (enabled) window.dispatchEvent(new Event('akeed:performance-route'))
  }, [enabled, pathname, search])
  useEffect(() => {
    if (!enabled || !shopify?.webVitals) return
    let active = true
    // Keep registration outside the auth gate so slow/failing startup is visible.
    void Promise.resolve()
      .then(() => {
        if (active)
          return shopify.webVitals!.onReport((report) => {
            if (active) reportShopifyVitals(report)
          })
      })
      .catch(() => undefined)
    return () => {
      active = false
      void Promise.resolve()
        .then(() => shopify.webVitals!.onReport(null))
        .catch(() => undefined)
    }
  }, [enabled, shopify])
}

export function useStartupReady(stage: StartupStage, ready: boolean) {
  const reported = useRef(false)
  useEffect(() => {
    if (ready && !reported.current && isStartupPerformanceEnabled()) {
      reported.current = true
      markStartupReady(stage)
    }
  }, [ready, stage])
}
