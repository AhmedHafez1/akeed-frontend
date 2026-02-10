'use client'

/**
 * Root Page — Mode-Aware Landing
 *
 * - EMBEDDED: Redirects to /dashboard (merchants don't need marketing page)
 * - STANDALONE: Shows the marketing HomePage (Hero, Pricing, FAQ, etc.)
 *
 * The redirect uses router.replace() so there's no back-button loop.
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/lib/locale'
import { HomePage } from '@/components/pages/HomePage'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { EmbeddedAuthGate } from '@/components/auth/EmbeddedAuthGate'

export default function Home() {
  const { isEmbedded, isLoading } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    if (isLoading) return

    if (isEmbedded) {
      // Embedded merchants go straight to dashboard — no marketing page
      router.replace(`/${locale}/dashboard${window.location.search}`)
    }
  }, [isEmbedded, isLoading, locale, router])

  // Show loader while detecting mode or during embedded redirect
  if (isLoading || isEmbedded) {
    return <FullPageLoader />
  }

  // Standalone: show the marketing homepage
  return (
    <EmbeddedAuthGate fallback={<FullPageLoader />}>
      <HomePage />
    </EmbeddedAuthGate>
  )
}
