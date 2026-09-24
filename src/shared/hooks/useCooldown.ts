'use client'

import { useEffect, useState } from 'react'

function secondsBetween(untilMs: number | null, nowMs: number): number {
  if (untilMs === null) return 0
  return Math.max(0, Math.ceil((untilMs - nowMs) / 1000))
}

/**
 * Whole seconds left until `untilIso`, ticking once a second and stopping at
 * zero. Null or a past time reads as zero, so the caller can simply check
 * `remaining > 0`.
 */
export function useCooldown(untilIso: string | null | undefined): number {
  const untilMs = untilIso ? new Date(untilIso).getTime() : null
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (untilMs === null) return

    const tick = () => {
      const current = Date.now()
      setNowMs(current)
      if (current >= untilMs) window.clearInterval(intervalId)
    }
    const firstTickId = window.setTimeout(tick, 0)
    const intervalId = window.setInterval(tick, 1000)

    return () => {
      window.clearTimeout(firstTickId)
      window.clearInterval(intervalId)
    }
  }, [untilMs])

  return secondsBetween(untilMs, nowMs)
}
