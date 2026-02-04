import type { ReactNode } from 'react'

interface EmbeddedLayoutProps {
  children: ReactNode
}

/**
 * Embedded Mode Layout - Shopify Polaris Integration
 *
 * Note: Dynamic import moved to effect to avoid async component issues.
 * For now, render a simple wrapper. Full Polaris integration should be
 * handled via a separate client component with useEffect for dynamic imports.
 */
export function EmbeddedLayout({ children }: EmbeddedLayoutProps) {
  return (
    <div className="p-4">
      {/* 
        Shopify Admin chrome provides navigation.
        TODO: Add proper Polaris AppProvider when needed.
      */}
      {children}
    </div>
  )
}
