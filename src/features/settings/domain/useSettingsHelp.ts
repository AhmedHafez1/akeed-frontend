'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

/** Shared interaction rules; each skin owns the help's appearance. */
export function useSettingsHelp() {
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    clearTimeout(leaveTimer.current)
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (
        !ref.current?.contains(event.target as Node) &&
        !contentRef.current?.contains(event.target as Node)
      )
        close()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, close])

  useEffect(() => () => clearTimeout(leaveTimer.current), [])

  const hoverHandlers = {
    onMouseEnter: () => {
      clearTimeout(leaveTimer.current)
      setOpen(true)
    },
    onMouseLeave: () => {
      leaveTimer.current = setTimeout(() => {
        if (!ref.current?.contains(document.activeElement)) setOpen(false)
      }, 150)
    },
  }

  return {
    id,
    ref,
    contentRef,
    open,
    close,
    hoverHandlers,
    handlers: {
      ...hoverHandlers,
      onFocus: () => setOpen(true),
      onBlur: close,
    },
  }
}
