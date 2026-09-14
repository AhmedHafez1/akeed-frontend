'use client'

import { Link2, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface IntegrationChip {
  id: string
  label: string
  icon: ReactNode
  muted?: boolean
}

export function HeroIntegrations() {
  const t = useTranslations('hero')

  const chips: IntegrationChip[] = [
    {
      id: 'shopify',
      label: t('integration_shopify'),
      icon: (
        <Image
          src="/images/landing/logos/shopify_icon_1.png"
          alt=""
          width={28}
          height={28}
          unoptimized
          className="h-6 w-6 object-contain"
        />
      ),
    },
    {
      id: 'independent',
      label: t('integration_independent'),
      icon: <Store className="text-primary h-5 w-5" />,
    },
    {
      id: 'more',
      label: t('integration_more'),
      icon: <Link2 className="text-primary h-5 w-5" />,
      muted: true,
    },
  ]

  return (
    <div className="flex w-full flex-col items-center gap-3 lg:items-start">
      <p className="text-sm">
        <span className="text-foreground font-semibold">
          {t('integrations_title')}
        </span>{' '}
        <span className="text-muted-foreground">{t('integrations_note')}</span>
      </p>

      <ul className="flex flex-wrap justify-center gap-3 lg:justify-start">
        {chips.map((chip) => (
          <li
            key={chip.id}
            className={cn(
              'rounded-control bg-card ring-border/80 flex h-13 items-center gap-2.5 px-4 ring-1',
              chip.muted
                ? 'text-muted-foreground text-sm'
                : 'text-foreground text-sm font-semibold'
            )}
          >
            {chip.icon}
            {chip.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
