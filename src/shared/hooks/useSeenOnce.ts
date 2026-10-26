'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Calls `onSeen` once, the first time at least `threshold` of the element is
 * on screen. Rendering, or sitting below the fold, does not count. Without
 * IntersectionObserver nothing is reported, which undercounts rather than
 * inflates.
 */
export function useSeenOnce<T extends Element>(
  ref: RefObject<T | null>,
  onSeen: () => void,
  threshold = 0.5
): void {
  const callback = useRef(onSeen)
  useEffect(() => {
    callback.current = onSeen
  }, [onSeen])

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    let seen = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (seen) return
        if (
          entries.some(
            (entry) =>
              entry.isIntersecting && entry.intersectionRatio >= threshold
          )
        ) {
          seen = true
          observer.disconnect()
          callback.current()
        }
      },
      { threshold }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold])
}
