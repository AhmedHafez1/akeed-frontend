import type { ReactNode } from 'react'
import Link from 'next/link'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import { cn } from '@/shared/lib/utils'

interface ShopifyContinueLinkProps {
  children: ReactNode
  className?: string
}

export function ShopifyContinueLink({
  children,
  className,
}: ShopifyContinueLinkProps) {
  return (
    <Link
      href={SHOPIFY_APP_STORE_LISTING_URL}
      className={cn(
        'border-primary-border bg-primary-subtle text-primary-subtle-foreground hover:bg-primary-subtle/70 focus-visible:ring-primary rounded-control flex min-h-12 w-full items-center justify-center gap-2 border px-4 py-3 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
    >
      <svg
        className="text-primary h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M15.337 2.167c-.026-.028-.057-.05-.089-.066a.397.397 0 0 0-.134-.027c-.05 0-.1.01-.145.027l-.91.33s-1.238-1.27-2.743-1.27c-.064 0-.13.004-.196.01-.027-.027-.055-.05-.088-.072C10.48.726 9.844.5 9.046.5c-2.096 0-3.104 2.621-3.428 3.95-.91.281-1.547.477-1.624.505-.478.15-.493.164-.555.605C3.384 5.89 2 16.983 2 16.983l11.031 2.034 6.03-1.35S15.363 2.195 15.337 2.167zm-2.644.536c-.626.192-1.318.405-2.025.622 0-.002.195-1.617-.706-2.411.89.224 1.746.964 2.73 1.789zm-1.644.505l-2.558.787c.248-.94.723-1.866 1.287-2.345.218-.184.513-.395.839-.556.582.643.432 1.65.432 2.114zm-1.163-3.19c.183 0 .35.03.506.085-.304.17-.615.4-.883.634-.687.596-1.364 1.693-1.625 3.187l-2.008.62c.38-1.457 1.473-4.525 4.01-4.525z" />
      </svg>
      <span>{children}</span>
    </Link>
  )
}
