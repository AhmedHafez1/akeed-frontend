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
  const { isEmbedded, shopDomain, appBridge, isLoading } = useAkeedMode()
  const [isEmbeddedReady, setIsEmbeddedReady] = useState(false)

  useEffect(() => {
    if (isLoading || !isEmbedded) return

    let active = true

    const ensureInstalled = async () => {
      if (!active) return

      try {
        const redirect = Redirect.create(appBridge!)
        const authUrl = `${API_BASE_URL}/auth/shopify?shop=${encodeURIComponent(
          shopDomain!
        )}`
        redirect.dispatch(Redirect.Action.REMOTE, authUrl)
        setIsEmbeddedReady(true)
      } catch (error) {
        console.error('Error during install check:', error)
        setIsEmbeddedReady(false)
      }
    }

    void ensureInstalled()

    return () => {
      active = false
    }
  }, [isLoading, isEmbedded, appBridge, shopDomain])

  if (isLoading) return fallback
  if (!isEmbedded) return children
  if (!isEmbeddedReady) return fallback

  return children
}
