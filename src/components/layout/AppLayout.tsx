'use client'

import { ReactNode, Suspense } from 'react'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { Sidebar } from './Sidebar'
import { Header as CustomHeader } from './Header'

/**
 * AppLayout - Adaptive Layout Component
 *
 * Automatically adapts the UI based on runtime mode:
 *
 * EMBEDDED MODE (Shopify):
 * - Uses Shopify Polaris Frame
 * - Hides custom sidebar/header
 * - Uses Shopify App Bridge for navigation
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
  const { isEmbedded, isLoading, appBridge } = useAkeedMode()

  // Show loading state while detecting mode
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-sm text-gray-600">Loading Akeed...</p>
        </div>
      </div>
    )
  }

  /**
   * EMBEDDED MODE - Shopify Admin Integration
   * Uses Polaris Frame for native Shopify feel
   */
  if (isEmbedded && appBridge) {
    return <EmbeddedLayout appBridge={appBridge}>{children}</EmbeddedLayout>
  }

  /**
   * STANDALONE MODE - Custom SaaS Portal
   * Uses Akeed's custom sidebar and header
   */
  return <StandaloneLayout>{children}</StandaloneLayout>
}

/**
 * Embedded Mode Layout - Shopify Polaris Integration
 */
async function EmbeddedLayout({
  children,
  appBridge,
}: {
  children: ReactNode
  appBridge: unknown
}) {
  // Dynamic import of Polaris to avoid loading it in standalone mode
  const { Frame, AppProvider } = await import('@shopify/polaris')

  return (
    <AppProvider
      i18n={{
        Polaris: {
          // Add Polaris translations if needed
          Common: {
            loading: 'Loading',
          },
        },
      }}
    >
      <Frame>
        {/* 
          No custom sidebar/header in embedded mode
          Shopify Admin chrome provides all navigation
        */}
        <div className="p-4">{children}</div>
      </Frame>
    </AppProvider>
  )
}

/**
 * Standalone Mode Layout - Custom SaaS UI
 */
function StandaloneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Custom Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Custom Header */}
        <CustomHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

/**
 * Export with Suspense boundary for useSearchParams
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  )
}
