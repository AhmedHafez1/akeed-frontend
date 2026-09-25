'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ImportModalHost } from '@/features/order-imports'

/**
 * The real import modal on the fixture route. The app opens it over
 * Verifications with `?import=`; here the route supplies the first target so
 * the replayed API stays in this fixture.
 */
export function FixtureImportModal({ initial }: { initial: string }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const hasTarget = searchParams.has('import')

  useEffect(() => {
    if (hasTarget) return
    const next = new URLSearchParams(searchParams.toString())
    next.set('import', initial)
    router.replace(`${pathname}?${next.toString()}`)
  }, [hasTarget, initial, pathname, router, searchParams])

  return <ImportModalHost />
}
