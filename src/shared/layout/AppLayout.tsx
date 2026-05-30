'use client'

import { type ReactNode, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useDelayedBoolean } from '@/shared/hooks/useDelayedBoolean'
import { StandaloneLayout } from './StandaloneLayout'

const EmbeddedLayout = dynamic(
  () => import('./EmbeddedLayout').then((mod) => mod.EmbeddedLayout),
  {
    ssr: false,
    loading: () => <AppLayoutSkeleton />,
  }
)

function AppLayoutSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-3xl animate-pulse space-y-4">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="h-28 rounded-xl bg-gray-200" />
        <div className="h-28 rounded-xl bg-gray-200" />
      </div>
    </div>
  )
}

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
  const showLayoutSkeleton = useDelayedBoolean(isLoading)

  if (isLoading && showLayoutSkeleton) {
    return <AppLayoutSkeleton />
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
    <Suspense fallback={<AppLayoutSkeleton />}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  )
}
