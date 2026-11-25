'use client'

import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'

interface Outcome {
  key: 'confirmed' | 'canceled' | 'no_reply'
  icon: LucideIcon
  accentClass: string
  badgeClass: string
  ruleClass: string
}

const OUTCOMES: Outcome[] = [
  {
    key: 'confirmed',
    icon: CheckCircle2,
    accentClass: 'border-t-success',
    badgeClass:
      'bg-success-subtle text-success-subtle-foreground ring-success-border',
    ruleClass: 'bg-success-subtle text-success-subtle-foreground',
  },
  {
    key: 'canceled',
    icon: XCircle,
    accentClass: 'border-t-destructive',
    badgeClass:
      'bg-destructive-subtle text-destructive-subtle-foreground ring-destructive-border',
    ruleClass: 'bg-destructive-subtle text-destructive-subtle-foreground',
  },
  {
    key: 'no_reply',
    icon: Clock,
    accentClass: 'border-t-warning',
    badgeClass:
      'bg-warning-subtle text-warning-subtle-foreground ring-warning-border',
    ruleClass: 'bg-warning-subtle text-warning-subtle-foreground',
  },
]

/** What Akeed does with each possible answer to the confirmation message. */
function Outcomes() {
  const t = useTranslations('outcomes')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="outcomes" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-6xl">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('main_title')}
          isRTL={isRTL}
        />

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {OUTCOMES.map(
            ({ key, icon: Icon, accentClass, badgeClass, ruleClass }) => (
              <li
                key={key}
                className={cn(
                  'rounded-card border-border bg-card shadow-card flex flex-col gap-4 border border-t-4 p-6 text-start',
                  accentClass
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1',
                      badgeClass
                    )}
                  >
                    <Icon aria-hidden className="h-6 w-6" />
                  </span>
                  <h3 className="text-foreground text-lg font-semibold">
                    {t(`${key}.title`)}
                  </h3>
                </div>

                <p
                  className={cn(
                    'flex w-fit items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold tracking-wide uppercase rtl:tracking-normal',
                    ruleClass
                  )}
                >
                  <span>{t(`${key}.reply`)}</span>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 rtl:-scale-x-100"
                  />
                  <span>{t(`${key}.action`)}</span>
                </p>

                <p className="text-muted-foreground text-sm leading-6">
                  {t(`${key}.description`)}
                </p>
              </li>
            )
          )}
        </ul>
      </Container>
    </Section>
  )
}

export default Outcomes
