'use client'

import { Check, Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/shared/ui'
import type { CreditSummary } from '../../domain/billing.types'

export function LaunchGiftCard({ summary }: { summary: CreditSummary }) {
  const t = useTranslations('billing')
  return (
    <Card className="border-primary-border bg-primary-subtle p-5">
      <div className="flex items-start gap-3">
        <span
          className="rounded-control text-primary shadow-raised grid size-10 shrink-0 place-items-center bg-white"
          aria-hidden
        >
          <Gift className="size-5" />
        </span>
        <div>
          <p className="text-primary-subtle-foreground font-semibold">
            {t('grant.title')}
          </p>
          <p className="text-primary-subtle-foreground text-body mt-1 opacity-90">
            {summary.freeGrant.granted
              ? t('grant.granted', { count: summary.freeGrant.quantity })
              : t('grant.pending', { count: summary.freeGrant.quantity })}
          </p>
        </div>
      </div>
    </Card>
  )
}

export function HowCreditsWorkCard() {
  const t = useTranslations('billing')
  return (
    <Card className="p-5">
      <h2 className="text-h3 text-foreground">{t('terms.title')}</h2>
      <ul className="text-muted-foreground text-body mt-4 space-y-3">
        {(['accepted', 'restored', 'expiry'] as const).map((key) => (
          <li key={key} className="flex gap-3">
            <Check className="text-primary mt-1 size-4 shrink-0" aria-hidden />
            <span>{t(`terms.${key}`)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
