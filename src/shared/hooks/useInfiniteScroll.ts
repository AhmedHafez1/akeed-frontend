'use client'

import { useCallback, useEffect, useRef } from 'react'

/** How far before the sentinel reaches the viewport a load is triggered. */
const DEFAULT_PREFETCH_MARGIN = '200px'

export interface UseInfiniteScrollOptions {
  /** Whether the source has another page to give. */
  hasMore: boolean
  /** Whether a page is in flight; the sentinel stays quiet until it lands. */
  isLoading: boolean
  /**
   * Whether the last attempt failed.
   *
   * Load-more so far being observer-driven, an unguarded failure would retry on
   * every intersection and hammer the endpoint. A failed page stops the
   * sentinel until something outside this hook offers the merchant a retry.
   */
  hasError?: boolean
  onLoadMore: () => void | Promise<void>
  /** Distance before the end at which to start loading. */
  prefetchMargin?: string
}

export interface InfiniteScrollRefs<
  TRoot extends HTMLElement,
  TSentinel extends HTMLElement,
> {
  /** Attach to the scrolling element. */
  rootRef: React.RefObject<TRoot | null>
  /** Attach to an empty element rendered after the last row, inside the root. */
  sentinelRef: React.RefObject<TSentinel | null>
}

/**
 * Load the next page when the end of a scrolling list comes into view.
 *
 * The observer is scoped to the scroll container rather than the viewport, so
 * it works for a table that owns its own scrollbar -- the page around it may
 * never move at all.
 */
export function useInfiniteScroll<
  TRoot extends HTMLElement = HTMLDivElement,
  TSentinel extends HTMLElement = HTMLDivElement,
>({
  hasMore,
  isLoading,
  hasError = false,
  onLoadMore,
  prefetchMargin = DEFAULT_PREFETCH_MARGIN,
}: UseInfiniteScrollOptions): InfiniteScrollRefs<TRoot, TSentinel> {
  const rootRef = useRef<TRoot>(null)
  const sentinelRef = useRef<TSentinel>(null)

  // Held in a ref so a caller that rebuilds the callback every render does not
  // tear the observer down and set it up again on each one.
  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const isArmed = hasMore && !isLoading && !hasError

  const attach = useCallback(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !isArmed) return undefined
    if (typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void onLoadMoreRef.current()
        }
      },
      { root: rootRef.current, rootMargin: prefetchMargin }
    )
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [isArmed, prefetchMargin])

  useEffect(attach, [attach])

  return { rootRef, sentinelRef }
}
