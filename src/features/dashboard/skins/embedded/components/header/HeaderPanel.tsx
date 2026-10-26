'use client'

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { Button, Text } from '@shopify/polaris'
import { XIcon } from '@shopify/polaris-icons'
import { useAnchoredPanel } from '../../../../domain/useAnchoredPanel'

/** Marks a header trigger, so a press on it is not an outside click. */
export const HEADER_TRIGGER_ATTRIBUTE = 'data-header-trigger'

export interface HeaderPanelProps {
  id: string
  heading: string
  closeLabel: string
  width: number
  anchorRef: RefObject<HTMLElement | null>
  /** `returnFocus` is true for Escape and Close, false for outside presses. */
  onClose: (returnFocus: boolean) => void
  children: ReactNode
}

/**
 * A light, non-modal dialog under a header trigger. It takes focus when it
 * opens, closes on Escape (focus back to the trigger), on a press outside
 * (focus stays where it went) and when Tab leaves it (no trap). It overlays
 * the page, so opening it never moves the dashboard.
 */
export function HeaderPanel({
  id,
  heading,
  closeLabel,
  width,
  anchorRef,
  onClose,
  children,
}: HeaderPanelProps) {
  const headingId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useAnchoredPanel({ panelRef, anchorRef, width })

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      onCloseRef.current(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (panelRef.current?.contains(target)) return
      if (target.closest(`[${HEADER_TRIGGER_ATTRIBUTE}]`)) return
      onCloseRef.current(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-labelledby={headingId}
      tabIndex={-1}
      onBlur={(event) => {
        const next = event.relatedTarget
        // Null when the focused control was removed (a dismissed tip) or the
        // press landed on nothing focusable; outside presses close elsewhere.
        if (!(next instanceof Node)) return
        if (panelRef.current?.contains(next)) return
        if (anchorRef.current?.contains(next)) return
        onCloseRef.current(false)
      }}
      className="fixed z-[var(--p-z-index-6)] overflow-x-hidden overflow-y-auto p-4 transition-opacity duration-[120ms] ease-out outline-none motion-reduce:transition-none starting:opacity-0"
      style={{
        background: 'var(--p-color-bg-surface)',
        border: 'var(--p-border-width-025) solid var(--p-color-border)',
        borderRadius: 'var(--p-border-radius-300)',
        boxShadow: 'var(--p-shadow-400)',
      }}
    >
      <div className="flex items-start justify-between gap-2 pb-3">
        <Text as="h2" variant="headingMd" id={headingId}>
          {heading}
        </Text>
        <div className="-me-1 -mt-1 shrink-0">
          <Button
            variant="tertiary"
            icon={XIcon}
            accessibilityLabel={closeLabel}
            onClick={() => onClose(true)}
          />
        </div>
      </div>
      {children}
    </div>
  )
}
