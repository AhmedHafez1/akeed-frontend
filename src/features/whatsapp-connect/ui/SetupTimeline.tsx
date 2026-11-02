'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const ROWS = [
  { key: 'verified', status: 'done' },
  { key: 'templates', status: 'next' },
  { key: 'sending', status: 'afterApproval' },
] as const

/**
 * What a saved connection still waits for. Only the first row is done: the
 * template and sending steps belong to later setup, so they never read as
 * under way here.
 */
export function SetupTimeline() {
  const t = useTranslations('whatsappConnect.timeline')
  return (
    <ol
      aria-label={t('label')}
      className="border-line bg-surface-sunken rounded-ak-control divide-line divide-y border"
    >
      {ROWS.map(({ key, status }) => (
        <li
          key={key}
          className="text-ak-caption grid grid-cols-[1.25rem_1fr_auto] items-center gap-3 px-3.5 py-2.5"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-5 items-center justify-center rounded-full border-[1.5px]',
              status === 'done' &&
                'border-brand bg-brand text-brand-foreground',
              status === 'next' && 'border-brand border-dashed',
              status === 'afterApproval' && 'border-line-strong'
            )}
          >
            {status === 'done' && (
              <Check className="size-3" strokeWidth={2.5} />
            )}
          </span>
          <span
            className={
              status === 'afterApproval' ? 'text-ink-muted' : 'text-ink'
            }
          >
            {t(key)}
          </span>
          <span
            className={cn(
              'font-semibold',
              status === 'done' ? 'text-brand-ink' : 'text-ink-muted'
            )}
          >
            {t(status)}
          </span>
        </li>
      ))}
    </ol>
  )
}
