'use client'

import { useCallback, useRef, useState } from 'react'

export type HeaderPanelId = 'usage' | 'tips'

/**
 * Which header panel is open, if any. One at a time: opening one closes the
 * other, and clicking an open panel's trigger closes it. A panel belongs to
 * the tab it was opened on, so switching tabs closes it without an effect.
 */
export function useHeaderPanels(activeTab: string) {
  const [state, setState] = useState<{
    id: HeaderPanelId
    tab: string
  } | null>(null)
  const usageTriggerRef = useRef<HTMLButtonElement>(null)
  const tipsTriggerRef = useRef<HTMLButtonElement>(null)

  const openPanel = state?.tab === activeTab ? state.id : null

  const toggle = useCallback(
    (id: HeaderPanelId) =>
      setState((current) =>
        current?.id === id && current.tab === activeTab
          ? null
          : { id, tab: activeTab }
      ),
    [activeTab]
  )

  /**
   * Closes the open panel. `returnFocus` puts focus back on its trigger, for
   * Escape and the Close button; the tips trigger can be gone by then (its
   * last entry dismissed), so the usage trigger stands in.
   */
  const close = useCallback(
    (returnFocus = false) => {
      const closing = openPanel
      setState(null)
      if (!returnFocus || !closing) return
      requestAnimationFrame(() => {
        const trigger =
          closing === 'tips' && tipsTriggerRef.current?.isConnected
            ? tipsTriggerRef.current
            : usageTriggerRef.current
        trigger?.focus()
      })
    },
    [openPanel]
  )

  return { openPanel, toggle, close, usageTriggerRef, tipsTriggerRef }
}
