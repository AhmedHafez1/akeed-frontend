'use client'

import { type ReactNode, Suspense } from 'react'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { FullPageLoader } from './FullPageLoader'
import { EmbeddedLayout } from './EmbeddedLayout'
import { StandaloneLayout } from './StandaloneLayout'

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
  const { isEmbedded, isLoading } = useAkeedMode()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (isEmbedded) {
    return <EmbeddedLayout>{children}</EmbeddedLayout>
  }

  return <StandaloneLayout>{children}</StandaloneLayout>
}

/**
 * Export with Suspense boundary for useSearchParams
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  )
}
