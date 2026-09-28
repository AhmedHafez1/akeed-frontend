'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ImportModalHost } from '@/features/order-imports'

/**
 * The real import modal on the fixture route. The app opens it over
 * Verifications with `?import=`; here the route supplies the first target so
 * the replayed API stays in this fixture. Only on arrival: once the modal
 * closes (an import sent), it stays closed, as it does over Verifications.
 */
export function FixtureImportModal({ initial }: { initial: string }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const hasTarget = searchParams.has('import')
  const opened = useRef(false)

  useEffect(() => {
    // Retried until the target shows up (a replace during hydration can be
    // lost); once it has, a later close is final.
    if (hasTarget) {
      opened.current = true
      return
    }
    if (opened.current) return
    const next = new URLSearchParams(searchParams.toString())
    next.set('import', initial)
    router.replace(`${pathname}?${next.toString()}`)
  }, [hasTarget, initial, pathname, router, searchParams])

  return <ImportModalHost />
}
