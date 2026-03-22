'use client'

import { type ReactNode, Suspense } from 'react'
import {
  BlockStack,
  Card,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from '@shopify/polaris'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedLayout } from './EmbeddedLayout'
import { StandaloneLayout } from './StandaloneLayout'

function AppLayoutSkeleton() {
  return (
    <SkeletonPage>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={4} />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
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

  if (isLoading) {
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
