'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { MiniWhatsAppMessage } from '@/features/marketing/ui/components/MiniWhatsAppMessage'
import { DEMO_ORDERS } from '@/features/marketing/ui/components/useMockupTemplate'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'

interface Outcome {
  key: 'confirmed' | 'canceled' | 'no_reply'
  icon: LucideIcon
  iconClass: string
  resultClass: string
}

const OUTCOMES: Outcome[] = [
  {
    key: 'confirmed',
    icon: CheckCircle2,
    iconClass:
      'bg-success-subtle text-success-subtle-foreground ring-success-border',
    resultClass: 'text-success',
  },
  {
    key: 'canceled',
    icon: XCircle,
    iconClass:
      'bg-destructive-subtle text-destructive-subtle-foreground ring-destructive-border',
    resultClass: 'text-destructive',
  },
  {
    key: 'no_reply',
    icon: Clock,
    iconClass:
      'bg-warning-subtle text-warning-subtle-foreground ring-warning-border',
    resultClass: 'text-warning-subtle-foreground',
  },
]

/** What Akeed does with each possible answer to the confirmation message. */
function Outcomes() {
  const t = useTranslations('outcomes')
  const { isRTL } = useLocaleInfo()
  const reduceMotion = useReducedMotion()

  const list: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.2 } },
  }
  const row: Variants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, x: isRTL ? -16 : 16 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' },
    },
  }

  return (
    <Section id="outcomes" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-5xl">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('main_title')}
          isRTL={isRTL}
        />

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-0">
          <MiniWhatsAppMessage
            className="shadow-card mx-auto w-full max-w-sm"
            text={t('message', { number: DEMO_ORDERS.flow.number })}
          />

          {/* The branches: a trunk line, one stub to each answer. */}
          <motion.ul
            variants={list}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="relative flex flex-col gap-3 lg:ps-16"
          >
            <span
              aria-hidden
              className="bg-border absolute start-0 top-1/2 hidden h-px w-8 lg:block"
            />
            <span
              aria-hidden
              className="bg-border absolute start-8 top-9 bottom-9 hidden w-px lg:block"
            />
            {OUTCOMES.map(({ key, icon: Icon, iconClass, resultClass }) => (
              <motion.li
                key={key}
                variants={row}
                className="bg-card ring-border shadow-card relative flex items-center gap-4 rounded-2xl px-5 py-4 ring-1"
              >
                <span
                  aria-hidden
                  className="bg-border absolute -start-8 top-1/2 hidden h-px w-8 lg:block"
                />
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1',
                    iconClass
                  )}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="text-foreground w-24 shrink-0 font-semibold sm:w-28">
                  {t(`${key}.title`)}
                </h3>
                <ArrowRight
                  aria-hidden
                  className="text-muted-foreground h-4 w-4 shrink-0 rtl:-scale-x-100"
                />
                <p className={cn('font-bold', resultClass)}>
                  {t(`${key}.result`)}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Container>
    </Section>
  )
}

export default Outcomes
