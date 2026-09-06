'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('StandaloneShell')

interface StandaloneIdentity {
  fullName: string | null
  workspaceName: string | null
  email: string | null
}

interface StandaloneShellContextValue {
  identity: StandaloneIdentity
  isIdentityLoading: boolean
}

const emptyIdentity: StandaloneIdentity = {
  fullName: null,
  workspaceName: null,
  email: null,
}

const StandaloneShellContext = createContext<StandaloneShellContextValue>({
  identity: emptyIdentity,
  isIdentityLoading: true,
})

function getMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = metadata?.[key]
  if (typeof value !== 'string') return null

  const normalizedValue = value.trim()
  return normalizedValue.length > 0 ? normalizedValue : null
}

export function StandaloneShellProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [identity, setIdentity] = useState<StandaloneIdentity>(emptyIdentity)
  const [isIdentityLoading, setIsIdentityLoading] = useState(true)

  useEffect(() => {
    let active = true

    auth
      .getCurrentUser()
      .then((user) => {
        if (!active || !user) return
        setIdentity({
          fullName: getMetadataValue(user.user_metadata, 'full_name'),
          workspaceName: getMetadataValue(user.user_metadata, 'company_name'),
          email: user.email ?? null,
        })
      })
      .catch((error) => {
        logger.warn('Unable to load the current user identity', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
      })
      .finally(() => {
        if (active) setIsIdentityLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ identity, isIdentityLoading }),
    [identity, isIdentityLoading]
  )

  return (
    <StandaloneShellContext.Provider value={value}>
      {children}
    </StandaloneShellContext.Provider>
  )
}

export function useStandaloneShell() {
  return useContext(StandaloneShellContext)
}
