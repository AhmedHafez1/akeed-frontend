'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const STEPS = ['review', 'connect', 'setup'] as const

/**
 * Review, Connect with Facebook, Setup. Only the current step shows its
 * name, so the row fits a phone in every language; the others keep theirs
 * for screen readers.
 */
export function SignupSteps({ current }: { current: 0 | 1 | 2 }) {
  const t = useTranslations('whatsappConnect.steps')
  return (
    <ol aria-label={t('label')} className="flex items-center gap-2.5">
      {STEPS.map((step, index) => {
        const done = index < current
        const now = index === current
        return (
          <Fragment key={step}>
            {index > 0 && (
              <li
                aria-hidden="true"
                className="bg-line-strong h-px min-w-3 flex-1"
              />
            )}
            <li
              aria-current={now ? 'step' : undefined}
              className={cn(
                'text-ak-label flex shrink-0 items-center gap-2',
                now ? 'text-ink' : 'text-ink-muted'
              )}
            >
              <span
                className={cn(
                  'flex size-5.5 shrink-0 items-center justify-center rounded-full border tabular-nums',
                  now && 'border-brand bg-brand text-brand-foreground',
                  done && 'border-brand-line bg-brand-soft text-brand-ink',
                  !now && !done && 'border-line-strong'
                )}
              >
                {done ? (
                  <Check
                    aria-hidden="true"
                    className="size-3"
                    strokeWidth={2.5}
                  />
                ) : (
                  <span aria-hidden="true">{index + 1}</span>
                )}
              </span>
              <span className={now ? undefined : 'sr-only'}>
                {t(step)}
                {done && <span className="sr-only">, {t('done')}</span>}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
