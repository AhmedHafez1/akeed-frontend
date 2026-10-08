import type { ReactNode, Ref } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button, StatusBadge } from '@/shared/ui'

interface SourceDoneStepProps {
  badge: string
  title: string
  body: string
  /** What happens next for this source, said plainly. */
  next: ReactNode
  dashboardLabel: string
  dashboardPath: string
  headingRef: Ref<HTMLHeadingElement>
}

/**
 * The end of a connected store's setup, drawn like Standalone's "You're
 * live": the mark, what is now true, what happens next and the one way on.
 * The words come from the source skin.
 */
export function SourceDoneStep({
  badge,
  title,
  body,
  next,
  dashboardLabel,
  dashboardPath,
  headingRef,
}: SourceDoneStepProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-6 text-center sm:py-10">
      <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full">
        <Check aria-hidden="true" className="size-8" strokeWidth={3} />
      </span>
      <StatusBadge kind="confirmed">{badge}</StatusBadge>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-ink text-h2 font-bold focus-visible:outline-none"
      >
        {title}
      </h1>
      <p className="text-ink text-body">{body}</p>
      <p className="text-ink-muted text-sm">{next}</p>
      <Button asChild size="lg" className="mt-2 px-8 font-semibold">
        <Link href={dashboardPath}>{dashboardLabel}</Link>
      </Button>
    </div>
  )
}
