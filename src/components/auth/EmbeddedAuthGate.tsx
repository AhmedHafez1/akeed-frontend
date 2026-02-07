'use client'

import { useEffect, useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAkeedMode } from '@/hooks/useAkeedMode'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

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
        const checkUrl = `${API_BASE_URL}/auth/shopify/check?shop=${encodeURIComponent(
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
        const authUrl = `${API_BASE_URL}/auth/shopify?shop=${encodeURIComponent(
          shopDomain
        )}&host=${encodeURIComponent(hostParam ?? '')}`
        redirect.dispatch(Redirect.Action.REMOTE, authUrl)
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
