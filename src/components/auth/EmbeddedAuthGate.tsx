'use client'

import { useEffect, useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { fetchWithAuth } from '@/lib/auth'
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
  const { isEmbedded, appBridge, shopDomain, isLoading } = useAkeedMode()
  const [isEmbeddedReady, setIsEmbeddedReady] = useState(false)

  console.log('Embedded auth gate', appBridge, shopDomain, isEmbedded)

  useEffect(() => {
    console.log('Embedded auth gate useEffect')

    if (isLoading || !isEmbedded || !appBridge) return

    console.log('Checking embedded auth status')

    let active = true

    const ensureInstalled = async () => {
      try {
        console.log('Checking auth status via API')
        const response = await fetchWithAuth('/auth/status')

        if (!active) return

        if (response.ok) {
          console.log('Embedded auth status OK')
          setIsEmbeddedReady(true)
          return
        }
      } catch {
        // Fall through to OAuth redirect
      }

      // Embedded + unauthenticated: escape iframe and start OAuth.
      const redirect = Redirect.create(appBridge)
      const authUrl = `${API_BASE_URL}/auth/shopify?shop=${encodeURIComponent(
        shopDomain!
      )}`
      redirect.dispatch(Redirect.Action.REMOTE, authUrl)
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
