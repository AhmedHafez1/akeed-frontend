'use client'

import { MessageSquare, RotateCcw, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  LandingIconBadge,
  landingInsetCardClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

/*
 * What a credit actually buys. This is the correction that matters most on the
 * page: billing meters one outbound WhatsApp message the provider accepted —
 * not one order — and a follow-up consumes a second credit. Saying "orders"
 * here would under-quote real cost by roughly half.
 */
const EXPLAINER_ITEMS = [
  { key: 'credit_is_message', icon: MessageSquare },
  { key: 'followup', icon: RotateCcw },
  { key: 'rejected', icon: ShieldCheck },
] as const

export function CreditModelExplainer() {
  const t = useTranslations('pricing_credits')

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {EXPLAINER_ITEMS.map(({ key, icon }) => (
        <div
          key={key}
          className={cn(landingInsetCardClass, 'flex flex-col gap-3 p-6')}
        >
          <LandingIconBadge icon={icon} size="sm" />
          <p className="text-foreground text-base font-semibold">
            {t(`${key}_title`)}
          </p>
          <p className="text-muted-foreground text-sm leading-6">
            {t(`${key}_body`)}
          </p>
        </div>
      ))}
    </div>
  )
}
