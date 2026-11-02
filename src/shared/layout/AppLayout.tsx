'use client'

import { type ReactNode, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { isWhatsappConnectRoute } from '@/shared/lib/locale'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { QueryProvider } from '@/shared/query/QueryProvider'
import { StandaloneLayout } from './StandaloneLayout'

const EmbeddedLayout = dynamic(
  () => import('./EmbeddedLayout').then((mod) => mod.EmbeddedLayout),
  {
    ssr: false,
    loading: () => null,
  }
)

/**
 * AppLayout - Adaptive Layout Component
 *
 * Automatically adapts the UI based on runtime mode:
 *
 * EMBEDDED MODE (Shopify):
 * - Uses Shopify Polaris Frame
 * - Hides custom sidebar/header
 * - Feels native to Shopify Admin
 *
 * STANDALONE MODE (SaaS):
 * - Uses custom Akeed sidebar/header
 * - Standard Next.js routing
 * - Full SaaS experience
 */

interface AppLayoutProps {
  children: ReactNode
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { isEmbedded } = useAkeedMode()
  const pathname = usePathname()

  // Opened top-level from Shopify too, where Polaris and App Bridge do not
  // apply: it always takes the standalone frame.
  if (isEmbedded && !isWhatsappConnectRoute(pathname)) {
    return <EmbeddedLayout>{children}</EmbeddedLayout>
  }

  return <StandaloneLayout>{children}</StandaloneLayout>
}

/**
 * Export with Suspense boundary for useSearchParams
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <QueryProvider>
      <Suspense fallback={null}>
        <AppLayoutInner>{children}</AppLayoutInner>
      </Suspense>
    </QueryProvider>
  )
}
