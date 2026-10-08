'use client'

import { useTranslations } from 'next-intl'
import { Check, Unplug, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type ConnectionLineState =
  | 'idle'
  | 'waiting'
  | 'connected'
  | 'refused'
  | 'disconnected'

interface ConnectionLineProps {
  state: ConnectionLineState
  /** What the store end is called; null shows "your store". */
  store: string | null
  /** True when `store` is an address, kept left to right in Arabic. */
  storeIsAddress?: boolean
}

const STORE_NODE: Record<ConnectionLineState, string> = {
  idle: 'border-line-strong text-ink-muted border-dashed',
  waiting: 'border-brand-line text-ink',
  connected: 'border-brand bg-brand-soft text-brand-ink',
  refused: 'border-destructive-border text-ink',
  disconnected: 'border-line text-ink-muted',
}

const BROKEN_LINE = {
  refused: 'border-destructive-border',
  disconnected: 'border-line border-dashed',
} as const

const BROKEN_NODE = {
  refused: 'bg-destructive-subtle text-destructive-subtle-foreground',
  disconnected: 'bg-muted text-muted-foreground',
} as const

/**
 * Akeed on one end, the merchant's store on the other, and the state of the
 * link between them. It sits at the top of every connection screen, so the
 * store being connected is always in view. The line is drawn; what it says is
 * read out once, as a sentence.
 */
export function ConnectionLine({
  state,
  store,
  storeIsAddress = false,
}: ConnectionLineProps) {
  const t = useTranslations('connectionLine')
  const storeName = store?.trim() || null
  const shownStore = storeName ?? t('yourStore')

  return (
    <div>
      <p className="sr-only">{t(`label.${state}`, { store: shownStore })}</p>
      <div aria-hidden="true" className="flex items-center gap-2">
        <span className="bg-brand text-brand-foreground rounded-control shrink-0 px-3 py-1.5 text-sm font-bold">
          {t('akeed')}
        </span>

        <span className="flex h-6 min-w-10 flex-1 items-center gap-1">
          {state === 'connected' ? (
            <span className="bg-brand motion-safe:animate-ak-grow block h-0.5 w-full rounded-full" />
          ) : state === 'refused' || state === 'disconnected' ? (
            <>
              <span className={cn('flex-1 border-t-2', BROKEN_LINE[state])} />
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  BROKEN_NODE[state]
                )}
              >
                {state === 'refused' ? (
                  <X className="size-3.5" strokeWidth={3} />
                ) : (
                  <Unplug className="size-3.5" />
                )}
              </span>
              <span className={cn('flex-1 border-t-2', BROKEN_LINE[state])} />
            </>
          ) : (
            <span
              className={cn(
                'block w-full border-t-2 border-dashed',
                state === 'waiting'
                  ? 'border-brand motion-safe:animate-pulse'
                  : 'border-line-strong'
              )}
            />
          )}
        </span>

        <span
          className={cn(
            'rounded-control flex max-w-[60%] min-w-0 items-center gap-1.5 border-2 px-3 py-1 text-sm font-semibold',
            STORE_NODE[state]
          )}
        >
          {state === 'connected' && (
            <Check className="size-4 shrink-0" strokeWidth={3} />
          )}
          {storeName && storeIsAddress ? (
            <bdi dir="ltr" className="truncate">
              {storeName}
            </bdi>
          ) : (
            <span className="truncate">{shownStore}</span>
          )}
        </span>
      </div>
    </div>
  )
}
