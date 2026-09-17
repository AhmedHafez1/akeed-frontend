'use client'

import { useEffect, useState } from 'react'
import { getAdminSession } from './adminApi'

/**
 * Resolves whether the signed-in user has admin access, for UI that should
 * only render for admins (e.g. a sidebar link). Access itself is still
 * enforced server-side by the admin routes/API — this never grants access,
 * only decides visibility.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    getAdminSession()
      .then(() => {
        if (active) setIsAdmin(true)
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })
    return () => {
      active = false
    }
  }, [])

  return isAdmin
}
