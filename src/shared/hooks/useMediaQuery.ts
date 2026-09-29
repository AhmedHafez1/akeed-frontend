'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Whether a CSS media query matches, kept in sync as the viewport changes.
 * Reads false on the server and before hydration, so markup that depends on
 * it must be progressive (the desktop layout is the safe default).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window !== 'undefined' && !!window.matchMedia
        ? window.matchMedia(query).matches
        : false,
    () => false
  )
}
