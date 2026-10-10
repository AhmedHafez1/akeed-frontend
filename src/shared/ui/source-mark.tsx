import Image from 'next/image'
import { FileUp } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

const LOGO_DIR = '/images/landing/logos'

/** Brand marks by source id; any other id is "no connected store". */
const BRAND_MARKS: Record<string, ReactNode> = {
  shopify: (
    <Image
      src={`${LOGO_DIR}/shopify_icon_1.png`}
      alt=""
      width={48}
      height={48}
      unoptimized
      draggable={false}
      className="size-[58%] object-contain"
    />
  ),
  woocommerce: (
    <Image
      src={`${LOGO_DIR}/woo.png`}
      alt=""
      width={48}
      height={48}
      unoptimized
      draggable={false}
      className="size-[58%] scale-[1.5] object-contain"
    />
  ),
  easyorders: (
    // The source file is the full wordmark; show only its icon.
    <span className="block h-5 w-[1.05rem] overflow-hidden" dir="ltr">
      <Image
        src={`${LOGO_DIR}/easy-order.png`}
        alt=""
        width={561}
        height={117}
        unoptimized
        draggable={false}
        className="h-5 w-auto max-w-none"
      />
    </span>
  ),
}

const SIZE_CLASSES = {
  sm: 'size-10 rounded-[0.625rem] [&_svg]:size-5',
  md: 'size-12 rounded-xl [&_svg]:size-6',
  lg: 'size-13 rounded-xl [&_svg]:size-6.5',
} as const

export interface SourceMarkProps {
  /** A start-route id: `shopify`, `woocommerce`, `easyorders` or `standalone`. */
  sourceId: string
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/**
 * The logo tile of an order source, shared by the homepage cards and signup.
 * Decorative: the source name is always written beside it.
 */
export function SourceMark({
  sourceId,
  size = 'md',
  className,
}: SourceMarkProps) {
  const brandMark = BRAND_MARKS[sourceId]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center',
        SIZE_CLASSES[size],
        brandMark ? 'bg-muted' : 'bg-primary-subtle text-primary',
        className
      )}
    >
      {brandMark ?? <FileUp strokeWidth={2} />}
    </span>
  )
}
