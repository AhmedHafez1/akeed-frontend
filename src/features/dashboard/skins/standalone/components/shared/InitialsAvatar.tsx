import { UserRound } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { customerInitials } from '@/features/dashboard/lib/orderDisplay'

/**
 * A round initials chip beside a customer's name, or a person glyph when
 * there is no name. Decorative: the name or phone is always written next to
 * it, so it is hidden from assistive technology.
 */
export function InitialsAvatar({
  name,
  size = 36,
}: {
  name: string | null
  size?: 32 | 36
}) {
  const initials = customerInitials(name)
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-neutral-soft text-ink-muted inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        size === 36 ? 'text-ak-caption size-9' : 'size-8 text-xs'
      )}
    >
      {initials || <UserRound className="size-4" />}
    </span>
  )
}
