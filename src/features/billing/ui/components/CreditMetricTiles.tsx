'use client'

import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Check, Clock3, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Card } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { formatCredits } from '../../domain/billingFormatters'
import type { CreditSummary } from '../../domain/billing.types'

interface CreditMetricTilesProps {
  summary: CreditSummary
  /** Derived from the loaded ledger, not fetched — see `summarize`. */
  messagesThisMonth: number
  /** False when the loaded window may not reach back to the 1st. */
  messagesExact: boolean
  monthStartLabel: string
}

interface Tile {
  key: string
  label: string
  help: string
  value: string
  icon: LucideIcon
  tone: 'default' | 'danger'
}

export function CreditMetricTiles({
  summary,
  messagesThisMonth,
  messagesExact,
  monthStartLabel,
}: CreditMetricTilesProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const inDebt = summary.debtCredits > 0

  const tiles: Tile[] = [
    {
      key: 'messages',
      label: t('metrics.messages'),
      help: messagesExact
        ? t('metrics.messagesHelp', { date: monthStartLabel })
        : t('metrics.messagesCapped', { count: messagesThisMonth }),
      /*
       * A capped drain can only prove a lower bound for the month, so the
       * number is marked rather than presented as a total it may undercount.
       */
      value: `${formatCredits(messagesThisMonth, locale)}${messagesExact ? '' : '+'}`,
      icon: TrendingUp,
      tone: 'default',
    },
    {
      key: 'debt',
      label: t('metrics.debt'),
      help: inDebt ? t('metrics.debtOutstanding') : t('metrics.debtShort'),
      value: formatCredits(summary.debtCredits, locale),
      icon: AlertTriangle,
      tone: inDebt ? 'danger' : 'default',
    },
    {
      key: 'held',
      label: t('metrics.held'),
      help: t('metrics.heldShort'),
      value: formatCredits(summary.heldCredits, locale),
      icon: Clock3,
      tone: 'default',
    },
    {
      key: 'posted',
      label: t('metrics.posted'),
      help: t('metrics.postedShort'),
      value: formatCredits(summary.postedBalance, locale),
      icon: Check,
      tone: 'default',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon
        const danger = tile.tone === 'danger'
        return (
          <Card
            key={tile.key}
            className={cn('p-5', danger && 'border-destructive/30')}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground text-body font-medium">
                {tile.label}
              </p>
              <span
                className={cn(
                  'rounded-control grid size-9 shrink-0 place-items-center',
                  danger
                    ? 'text-destructive bg-red-50 dark:bg-red-950'
                    : 'bg-muted text-muted-foreground'
                )}
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
            </div>
            <p
              className={cn(
                'mt-3 text-3xl font-bold',
                danger ? 'text-destructive' : 'text-foreground'
              )}
            >
              {/*
               * `dir` goes on the number itself, not the paragraph: the
               * paragraph must keep the page direction so the value aligns
               * under its label, while the digits and any sign stay LTR.
               */}
              <span dir="ltr" className="tabular-nums">
                {tile.value}
              </span>
            </p>
            <p className="text-muted-foreground text-caption mt-1">
              {tile.help}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
