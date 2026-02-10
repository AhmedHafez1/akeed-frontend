'use client'

/**
 * EmbeddedNavigation — Shopify Admin Sidebar Navigation
 *
 * Registers navigation links in the Shopify Admin sidebar using
 * App Bridge v3 NavigationMenu + AppLink actions.
 *
 * This component renders nothing — it only configures the sidebar
 * items that Shopify surfaces in its Admin chrome.
 */

import { useEffect } from 'react'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname } from '@/lib/locale'

export function EmbeddedNavigation() {
  const { appBridge } = useAkeedMode()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    if (!appBridge) return

    let mounted = true

    const setupNavigation = async () => {
      try {
        const { NavigationMenu, AppLink } =
          await import('@shopify/app-bridge/actions')

        if (!mounted) return

        // ── Define nav items ──────────────────────────────────────
        const dashboardLink = AppLink.create(appBridge, {
          label: 'Dashboard',
          destination: `/${locale}/dashboard`,
        })

        const settingsLink = AppLink.create(appBridge, {
          label: 'Settings',
          destination: `/${locale}/settings`,
        })

        // ── Register navigation menu ──────────────────────────────
        NavigationMenu.create(appBridge, {
          items: [dashboardLink, settingsLink],
          active: undefined, // Shopify will match based on current URL
        })
      } catch (error) {
        console.error('[Akeed] Failed to setup embedded navigation:', error)
      }
    }

    void setupNavigation()

    return () => {
      mounted = false
    }
  }, [appBridge, locale])

  // This component renders nothing — navigation is handled by Shopify chrome
  return null
}
