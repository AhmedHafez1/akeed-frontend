'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Check, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { MiniWhatsAppMessage } from '@/features/marketing/ui/components/MiniWhatsAppMessage'
import {
  DEMO_ORDERS,
  useMockupTemplate,
} from '@/features/marketing/ui/components/useMockupTemplate'
import { cn } from '@/shared/lib/utils'

const ORDER = DEMO_ORDERS.flow

function OrderCard({
  badge,
  status,
  footer,
  verified = false,
}: {
  badge?: ReactNode
  status: ReactNode
  footer: ReactNode
  verified?: boolean
}) {
  const t = useTranslations('how_it_works.card')
  const { customer } = useMockupTemplate()

  return (
    <div
      className={cn(
        'bg-card relative flex h-full flex-col overflow-hidden rounded-2xl ring-1',
        verified
          ? 'ring-success-border shadow-card ring-2'
          : 'ring-border shadow-card'
      )}
    >
      {badge}
      <div className="flex items-center gap-4 px-5 pt-6">
        <span className="bg-muted relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
          <Package aria-hidden className="text-muted-foreground h-7 w-7" />
          {verified && (
            <span className="bg-success text-success-foreground ring-card absolute -end-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-2">
              <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-foreground text-lg font-bold">
            {t('order', { number: ORDER.number })}
          </p>
          <p className="text-muted-foreground truncate text-sm">{customer}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center px-5 py-6">{status}</div>
      {footer}
    </div>
  )
}

/**
 * The confirmation flow drawn as the merchant sees it: a new COD order, the
 * WhatsApp message the customer confirms, and the order ready to ship.
 */
export function HowItWorksFlow() {
  const t = useTranslations('how_it_works')
  const { template, formatTotal } = useMockupTemplate()
  const reduceMotion = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.35 } },
  }
  const item: Variants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.5, ease: 'easeOut' },
    },
  }

  const steps = [
    {
      key: 'order',
      card: (
        <OrderCard
          badge={
            <span className="bg-primary-subtle text-primary absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
              <span className="bg-primary h-1.5 w-1.5 rounded-full" />
              {t('card.new')}
            </span>
          }
          status={
            <span className="bg-warning-subtle text-warning-subtle-foreground ring-warning-border rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1">
              {t('card.cod')}
            </span>
          }
          footer={
            <div className="bg-muted text-foreground border-border border-t px-5 py-3 text-center font-bold">
              <bdi>{formatTotal(ORDER)}</bdi>
            </div>
          }
        />
      ),
      title: t('steps.order.title'),
      description: t('steps.order.description'),
    },
    {
      key: 'confirm',
      card: (
        <MiniWhatsAppMessage
          className="shadow-card h-full"
          text={t('card.message', {
            number: ORDER.number,
            store: template.store,
          })}
          pressedTone="confirm"
        />
      ),
      title: t('steps.confirm.title'),
    },
    {
      key: 'ship',
      card: (
        <OrderCard
          verified
          status={
            <span className="bg-success-subtle text-success-subtle-foreground ring-success-border inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1">
              <Check aria-hidden className="h-4 w-4" strokeWidth={3} />
              {t('card.verified')}
            </span>
          }
          footer={
            <div className="bg-success-subtle text-success-subtle-foreground border-success-border border-t px-5 py-3 text-center font-bold">
              {t('card.ready')}
            </div>
          }
        />
      ),
      title: t('steps.ship.title'),
    },
  ]

  return (
    <motion.ol
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8"
    >
      {steps.map((step, index) => (
        <motion.li
          key={step.key}
          variants={item}
          className="flex flex-col-reverse gap-5 lg:flex-col lg:gap-8"
        >
          {/* Same height in a row, so the step markers line up beneath. */}
          <div aria-hidden className="mx-auto w-full max-w-sm lg:h-64">
            {step.card}
          </div>

          <div className="relative flex flex-col items-center gap-3 text-center">
            {/* Connector halves: they meet the neighbouring markers. */}
            {index > 0 && (
              <span
                aria-hidden
                className="bg-primary-border absolute -start-4 end-1/2 top-6 hidden h-0.5 lg:block"
              />
            )}
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="bg-primary-border absolute start-1/2 -end-4 top-6 hidden h-0.5 lg:block"
              />
            )}
            <span className="bg-primary-subtle text-primary ring-primary-border relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-4">
              {index + 1}
            </span>
            <h3 className="text-foreground text-lg font-bold text-balance sm:text-xl">
              {step.title}
            </h3>
            {step.description && (
              <p className="text-muted-foreground max-w-xs text-sm leading-6">
                {step.description}
              </p>
            )}
          </div>
        </motion.li>
      ))}
    </motion.ol>
  )
}
