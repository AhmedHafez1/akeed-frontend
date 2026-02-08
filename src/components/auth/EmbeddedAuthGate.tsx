'use client'

import { use, useEffect, useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { useSearchParams } from 'next/navigation'

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
  const pathParams = useSearchParams()
  const installed = pathParams.get('installed') === 'true'

  useEffect(() => {
    if (isLoading || !isEmbedded || !shopDomain || !appBridge) return

    let active = true

    const ensureInstalled = async () => {
      if (!active) return

      if (installed) {
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
          headers: {
            accept: 'application/json',
          },
          cache: 'no-store',
        })

        const contentType = response.headers.get('content-type') ?? ''
        let alreadyInstalled = false

        if (response.ok && contentType.includes('application/json')) {
          const data = (await response.json()) as { installed?: boolean }
          alreadyInstalled = Boolean(data.installed)
        }

        if (alreadyInstalled) {
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
  }, [isLoading, isEmbedded, appBridge, shopDomain, hostParam])

  if (isLoading) return fallback
  if (!isEmbedded) return children
  if (!isEmbeddedReady) return fallback

  return children
}
