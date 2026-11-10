'use client'

import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { useSettingsHelp } from '@/features/settings/domain/useSettingsHelp'

export function SettingsHelp({
  label,
  content,
  rich = false,
}: {
  label: string
  content: ReactNode
  rich?: boolean
}) {
  const {
    id,
    ref: activatorRef,
    contentRef,
    open,
    hoverHandlers,
    handlers,
  } = useSettingsHelp()
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: rich ? 384 : 256,
  })

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = activatorRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(rich ? 384 : 256, window.innerWidth - 24)
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
  }, [open, activatorRef, contentRef, content, rich])

  return (
    <>
      <button
        type="button"
        ref={activatorRef}
        {...handlers}
        aria-label={label}
        aria-describedby={open ? id : undefined}
        className="ak-focus text-ink-muted hover:bg-neutral-soft inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0.5 align-middle"
      >
        <Info className="size-4" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={contentRef}
            {...hoverHandlers}
            id={id}
            role="tooltip"
            className="bg-inverse text-inverse-foreground shadow-overlay rounded-control text-ak-caption fixed z-50 max-h-[calc(100dvh-24px)] overflow-y-auto px-3 py-2 text-start wrap-anywhere"
            style={position}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  )
}
