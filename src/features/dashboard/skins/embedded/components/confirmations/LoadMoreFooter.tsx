'use client'

import { useEffect } from 'react'
import { InlineStack, Spinner } from '@shopify/polaris'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'

interface LoadMoreFooterProps {
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  /** Spinner label; also what a screen reader hears while it loads. */
  loadingLabel: string
  children: React.ReactNode
}

/**
 * Caps the scroll box at the room left under whatever sits above it, so the
 * list reaches the bottom of the app frame and the page itself never scrolls.
 * The room is measured rather than guessed because the chrome around the box
 * varies: a banner, a wrapped toolbar, the activation section. It depends only
 * on what sits around the box, never on the box's own height, so it settles in
 * one pass. Without `ResizeObserver` the CSS fallback applies.
 */
function useFitToWindow(boxRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const box = boxRef.current
    const content = box?.closest('.akeed-embedded-content')
    if (!box || !content || typeof ResizeObserver === 'undefined') return

    let frame = 0
    const fit = () => {
      cancelAnimationFrame(frame)
      // A frame later, so writing the height never re-enters the observer.
      frame = requestAnimationFrame(() => {
        const boxRect = box.getBoundingClientRect()
        const above = boxRect.top + window.scrollY
        const below = content.getBoundingClientRect().bottom - boxRect.bottom
        const room = Math.floor(window.innerHeight - above - below)
        box.style.setProperty('--akeed-scroll-fit', `${room}px`)
      })
    }

    const observer = new ResizeObserver(fit)
    observer.observe(content)
    window.addEventListener('resize', fit)
    fit()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [boxRef])
}

/**
 * The embedded list's scroll box: it fills the rest of the window, the rows
 * scroll inside it (see `.akeed-embedded-scroll`) and the next page loads when
 * its end comes near. `tabIndex` makes it scrollable from the keyboard.
 */
export function LoadMoreFooter({
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadingLabel,
  children,
}: LoadMoreFooterProps) {
  const { rootRef, sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore,
  })
  useFitToWindow(rootRef)

  return (
    <div ref={rootRef} tabIndex={0} className="akeed-embedded-scroll">
      {children}
      <div ref={sentinelRef} aria-hidden="true" />
      {isLoadingMore && (
        <InlineStack align="center">
          <div className="p-3">
            <Spinner size="small" accessibilityLabel={loadingLabel} />
          </div>
        </InlineStack>
      )}
    </div>
  )
}
