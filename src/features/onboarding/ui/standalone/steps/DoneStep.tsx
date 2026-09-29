'use client'

import { Fragment, type Ref } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, Check, Package, Upload } from 'lucide-react'
import { useCreditOffer } from '@/features/onboarding/hooks/useCreditOffer'
import { importModalPath } from '@/features/order-imports/domain/importRoutes'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Button, Skeleton, StatGroup, StatusBadge, akCard } from '@/shared/ui'

/** Where "Add your first order" lands: the dashboard with the dialog open. */
export const FIRST_ORDER_PATH = '/dashboard?new-order=1'

const PIPELINE = ['add', 'send', 'reply'] as const

interface DoneStepProps {
  headingRef: Ref<HTMLHeadingElement>
}

/**
 * Step "You're live": what happens with every order from now on, the money
 * in plain numbers, and one next step, adding the first real order.
 */
export function DoneStep({ headingRef }: DoneStepProps) {
  const t = useTranslations('standaloneOnboarding.done')
  const locale = useLocale()
  const { offer } = useCreditOffer()

  const valueOrSkeleton = (value: string | undefined) =>
    value ?? <Skeleton aria-hidden="true" className="h-8 w-24" />

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full">
          <Check aria-hidden="true" className="size-8" strokeWidth={3} />
        </span>
        <StatusBadge kind="confirmed">{t('badge')}</StatusBadge>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-ink text-h2 font-bold focus-visible:outline-none"
        >
          {t('heading')}
        </h1>
      </div>

      <ol
        aria-label={t('pipelineLabel')}
        className={cn(
          akCard,
          'grid gap-6 p-6 text-start sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:p-8'
        )}
      >
        {PIPELINE.map((stage, index) => (
          <Fragment key={stage}>
            <li className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="bg-brand-soft text-brand-ink inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-ink font-semibold">
                  {t(`pipeline.${stage}.title`)}
                </p>
              </div>
              <p className="text-ink-muted text-sm">
                {t(`pipeline.${stage}.description`)}
              </p>
            </li>
            {index < PIPELINE.length - 1 && (
              <li
                aria-hidden="true"
                className="text-ink-muted hidden items-center justify-center px-2 sm:flex"
              >
                <ArrowLeft className="size-7 ltr:rotate-180" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>

      <StatGroup
        items={[
          {
            id: 'balance',
            label: t('stats.balanceLabel'),
            value: valueOrSkeleton(
              offer
                ? t('stats.balanceValue', { count: offer.count })
                : undefined
            ),
            caption: t('stats.balanceCaption'),
          },
          {
            id: 'price',
            label: t('stats.priceLabel'),
            value: valueOrSkeleton(offer?.price),
            caption: t('stats.priceCaption'),
          },
          {
            id: 'test',
            label: t('stats.testLabel'),
            value: t('stats.testValue'),
            caption: t('stats.testCaption'),
          },
        ]}
      />

      <div className="space-y-3">
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="gap-2 font-semibold">
            <Link href={withLocale(FIRST_ORDER_PATH, locale)}>
              <Package aria-hidden="true" />
              {t('addOrder')}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href={withLocale(importModalPath('new'), locale)}>
              <Upload aria-hidden="true" />
              {t('importFile')}
            </Link>
          </Button>
          <Button asChild variant="link" className="font-semibold">
            <Link href={withLocale('/dashboard', locale)}>
              {t('dashboard')}
            </Link>
          </Button>
        </div>
        <p className="text-ink-muted text-sm">{t('caption')}</p>
      </div>
    </div>
  )
}
