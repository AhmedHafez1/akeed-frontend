'use client'

import { useEffect, useState } from 'react'
import { SKELETON_VISIBILITY_DELAY_MS } from '@/shared/config/loading'

/**
 * Delays switching to true to avoid short loading flashes.
 * Switches to false immediately.
 */
export function useDelayedBoolean(
  value: boolean,
  delayMs = SKELETON_VISIBILITY_DELAY_MS
): boolean {
  const [delayedValue, setDelayedValue] = useState(false)

  useEffect(() => {
    const timeoutMs = value ? delayMs : 0
    const timeoutId = window.setTimeout(() => {
      setDelayedValue(value)
    }, timeoutMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delayMs, value])

  return delayedValue
}
