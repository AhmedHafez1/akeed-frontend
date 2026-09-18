import Image from 'next/image'

import { cn } from '@/shared/lib/utils'

interface AkeedLogoProps {
  className?: string
}

/**
 * Horizontal wordmark for surfaces that follow the theme. Both variants are
 * rendered and swapped with CSS, so the right one shows on first paint without
 * waiting for the theme to resolve on the client. Always-dark surfaces (public
 * header/footer, auth hero) use the white file directly instead.
 */
export function AkeedLogo({ className }: AkeedLogoProps) {
  const shared = cn('w-auto object-contain', className)

  return (
    <>
      <Image
        src="/images/akeed-web-logo-horizontal.png"
        alt="Akeed"
        width={118}
        height={50}
        priority
        className={cn(shared, 'dark:hidden')}
      />
      <Image
        src="/images/akeed-web-logo-horizontal-white.png"
        alt="Akeed"
        width={118}
        height={50}
        priority
        className={cn(shared, 'hidden dark:block')}
      />
    </>
  )
}
