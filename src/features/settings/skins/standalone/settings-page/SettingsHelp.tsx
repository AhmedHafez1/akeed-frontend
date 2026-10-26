'use client'

import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { useSettingsHelp } from '@/features/settings/domain/useSettingsHelp'

export function SettingsHelp({
  label,
  content,
}: {
  label: string
  content: string
}) {
  const {
    id,
    ref: activatorRef,
    contentRef,
    open,
    hoverHandlers,
    handlers,
  } = useSettingsHelp()
  const [position, setPosition] = useState({ top: 0, left: 0, width: 256 })

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = activatorRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(256, window.innerWidth - 24)
      const height = contentRef.current?.getBoundingClientRect().height ?? 0
      const top =
        rect.top - height - 8 >= 12 ? rect.top - height - 8 : rect.bottom + 8
      setPosition({
        width,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        top: Math.max(12, Math.min(top, window.innerHeight - height - 12)),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, activatorRef, contentRef, content])

  return (
    <span
      ref={activatorRef}
      {...handlers}
      role="img"
      tabIndex={0}
      aria-label={label}
      aria-describedby={open ? id : undefined}
      className="ak-focus text-ink-muted inline-flex size-5 shrink-0 items-center justify-center rounded-sm align-middle"
    >
      <Info className="size-4" aria-hidden="true" />
      {open &&
        createPortal(
          <span
            ref={contentRef}
            {...hoverHandlers}
            id={id}
            role="tooltip"
            className="bg-inverse text-inverse-foreground shadow-overlay rounded-control text-ak-caption fixed z-50 max-h-[calc(100dvh-24px)] overflow-y-auto px-3 py-2"
            style={position}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  )
}
