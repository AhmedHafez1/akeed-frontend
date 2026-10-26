'use client'

import { useLayoutEffect, type RefObject } from 'react'

const GUTTER = 16
const GAP = 8
/** Polaris's md breakpoint, where the header tools move under the title. */
const NARROW_BELOW = 768
const MIN_HEIGHT = 120

/** Marks the header's end group (tools and period) that narrow panels sit under. */
export const HEADER_ACTIONS_ATTRIBUTE = 'data-header-actions'

/**
 * Places a fixed panel next to its trigger, inside the viewport the app
 * actually has (the Shopify iframe, not the top window). Wide: 8px under the
 * trigger, aligned to its logical end. Narrow: under the whole tools group,
 * full width less the gutters, so the period select stays reachable. Flips
 * above when there is more room there, and scrolls inside rather than
 * running off the screen. Writes styles directly, so moving it never
 * re-renders the content.
 */
export function useAnchoredPanel({
  panelRef,
  anchorRef,
  width,
}: {
  panelRef: RefObject<HTMLElement | null>
  anchorRef: RefObject<HTMLElement | null>
  width: number
}) {
  useLayoutEffect(() => {
    const panel = panelRef.current
    const anchor = anchorRef.current
    if (!panel || !anchor) return
    const group =
      anchor.closest<HTMLElement>(`[${HEADER_ACTIONS_ATTRIBUTE}]`) ?? anchor

    const place = () => {
      const viewportWidth = document.documentElement.clientWidth
      const viewportHeight = window.innerHeight
      const narrow = viewportWidth < NARROW_BELOW
      const rtl = getComputedStyle(group).direction === 'rtl'
      const panelWidth = Math.max(
        0,
        Math.min(narrow ? Infinity : width, viewportWidth - GUTTER * 2)
      )
      const anchorRect = anchor.getBoundingClientRect()
      const reference = narrow ? group.getBoundingClientRect() : anchorRect

      const preferredLeft = narrow
        ? GUTTER
        : rtl
          ? anchorRect.left
          : anchorRect.right - panelWidth
      const left = Math.min(
        Math.max(preferredLeft, GUTTER),
        Math.max(GUTTER, viewportWidth - GUTTER - panelWidth)
      )

      panel.style.width = `${panelWidth}px`
      panel.style.left = `${left}px`
      // scrollHeight is the full content height even while capped.
      const natural = panel.scrollHeight
      const spaceBelow = viewportHeight - reference.bottom - GAP * 2
      const spaceAbove = reference.top - GAP * 2
      const flip = natural > spaceBelow && spaceAbove > spaceBelow

      if (flip) {
        panel.style.top = 'auto'
        panel.style.bottom = `${viewportHeight - reference.top + GAP}px`
      } else {
        panel.style.bottom = 'auto'
        panel.style.top = `${reference.bottom + GAP}px`
      }
      panel.style.maxHeight = `${Math.max(MIN_HEIGHT, flip ? spaceAbove : spaceBelow)}px`
    }

    // Scrolling inside the panel itself never moves it.
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && panel.contains(event.target)) return
      place()
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place)
    observer?.observe(group)
    observer?.observe(anchor)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
      observer?.disconnect()
    }
  }, [panelRef, anchorRef, width])
}
