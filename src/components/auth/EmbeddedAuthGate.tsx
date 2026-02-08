'use client'

import { useEffect, useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { useSearchParams } from 'next/dist/client/components/navigation'

interface EmbeddedAuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function EmbeddedAuthGate({
  children,
  fallback = null,
}: EmbeddedAuthGateProps) {
  const { isEmbedded, shopDomain, hostParam, appBridge, isLoading } =
    useAkeedMode()
  const [isEmbeddedReady, setIsEmbeddedReady] = useState(false)
  const searchParams = useSearchParams()
  const installed = searchParams.get('installed') === 'true'

  useEffect(() => {
    if (isLoading || !isEmbedded || !shopDomain || !appBridge) return

    let active = true

    const ensureInstalled = async () => {
      if (!active) return

      if (installed) {
        // If we have the 'installed' param, we can skip the check and go straight to ready
        setIsEmbeddedReady(true)
        return
      }

      try {
        const checkUrl = `/auth/shopify/check?shop=${encodeURIComponent(
          shopDomain
        )}`
        const response = await fetch(checkUrl, {
          method: 'GET',
          credentials: 'include',
        })
        const data = (await response.json()) as { installed?: boolean }

        if (data.installed) {
          setIsEmbeddedReady(true)
          return
        }

        const redirect = Redirect.create(appBridge)
        const authUrl = new URL('/auth/shopify', window.location.origin)
        authUrl.searchParams.set('shop', shopDomain)
        authUrl.searchParams.set('host', hostParam ?? '')
        redirect.dispatch(Redirect.Action.REMOTE, authUrl.toString())
        setIsEmbeddedReady(false)
      } catch (error) {
        console.error('Error during install check:', error)
        setIsEmbeddedReady(false)
      }
    }

    void ensureInstalled()

    return () => {
      active = false
    }
  }, [installed, isLoading, isEmbedded, appBridge, shopDomain, hostParam])

  if (isLoading) return fallback
  if (!isEmbedded) return children
  if (!isEmbeddedReady) return fallback

  return children
}
