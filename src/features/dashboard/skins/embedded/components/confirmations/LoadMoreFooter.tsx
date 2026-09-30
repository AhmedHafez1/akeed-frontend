'use client'

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
 * The embedded list's scroll box: the rows scroll inside it (see
 * `.akeed-embedded-scroll`) and the next page loads when its end comes near.
 * `tabIndex` makes it scrollable from the keyboard.
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
