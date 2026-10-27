'use client'

import { useEffect, useRef, type RefObject } from 'react'

/** A brief open or a tip below the fold must not clear its unread indicator. */
export function useTipReadVisibility(
  ref: RefObject<HTMLElement | null>,
  onRead: () => void,
  enabled: boolean
): void {
  const callback = useRef(onRead)
  useEffect(() => {
    callback.current = onRead
  }, [onRead])

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof IntersectionObserver === 'undefined')
      return
    let visible = false
    let read = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const resetTimer = () => {
      clearTimeout(timer)
      timer = undefined
    }
    const updateTimer = () => {
      resetTimer()
      if (read || !visible || document.visibilityState !== 'visible') return
      timer = setTimeout(() => {
        read = true
        observer.disconnect()
        callback.current()
      }, 2000)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((entry) => entry.target === element)
        if (!entry) return
        const nextVisible =
          entry.isIntersecting && entry.intersectionRatio >= 0.5
        if (nextVisible === visible) return
        visible = nextVisible
        updateTimer()
      },
      { threshold: 0.5 }
    )
    document.addEventListener('visibilitychange', updateTimer)
    observer.observe(element)
    return () => {
      resetTimer()
      observer.disconnect()
      document.removeEventListener('visibilitychange', updateTimer)
    }
  }, [ref, enabled])
}
