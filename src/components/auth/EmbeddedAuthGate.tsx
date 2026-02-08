'use client'

import { useEffect, useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAkeedMode } from '@/hooks/useAkeedMode'

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

  useEffect(() => {
    if (isLoading || !isEmbedded || !shopDomain || !appBridge) return

    let active = true

    const ensureInstalled = async () => {
      if (!active) return

      try {
        const checkUrl = new URL('/auth/shopify/check', window.location.origin)
        checkUrl.searchParams.set('shop', shopDomain)
        const response = await fetch(checkUrl, {
          method: 'GET',
          credentials: 'include',
        })
        if (!response.ok) {
          const body = await response.text()
          throw new Error(
            `Install check failed (${response.status}): ${body.slice(0, 200)}`
          )
        }

        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          const body = await response.text()
          throw new Error(
            `Install check returned non-JSON response: ${body.slice(0, 200)}`
          )
        }

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
  }, [isLoading, isEmbedded, appBridge, shopDomain, hostParam])

  if (isLoading) return fallback
  if (!isEmbedded) return children
  if (!isEmbeddedReady) return fallback

  return children
}
