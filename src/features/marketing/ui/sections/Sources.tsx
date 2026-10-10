'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { getStartRouteTarget } from '@/features/marketing/domain/acquisitionPaths'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import {
  DEFAULT_SIGNUP_SOURCE_ID,
  getStartRoutes,
  type StartRoute,
} from '@/shared/config/commerceSources'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { SourceMark } from '@/shared/ui/source-mark'

/** What the no-store route accepts; message keys under `sources.standalone.chips`. */
const STANDALONE_CHIPS = ['manual', 'file', 'api'] as const

const CARD_CLASS =
  'group rounded-card border-border bg-card shadow-card hover:border-primary-border hover:shadow-overlay focus-visible:ring-ring focus-visible:ring-offset-background flex h-full flex-col gap-3.5 border p-6 text-start transition-[border-color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

interface SourcesProps {
  /** Start routes to show; a switched-off store is not among them. */
  routes?: readonly StartRoute[]
}

/**
 * The four ways to start, one card each, and each card one link: Shopify to
 * the App Store, the others to the account form with that source chosen.
 */
function Sources({ routes = getStartRoutes() }: SourcesProps) {
  const t = useTranslations('sources')
  const { locale, isRTL } = useAcquisition()

  return (
    <Section id="sources" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={t('title')}
          description={t('subtitle')}
          isRTL={isRTL}
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {routes.map((route) => {
            const target = getStartRouteTarget(route, locale)
            const isExternal = target.kind === 'external'
            const isStandalone = route.id === DEFAULT_SIGNUP_SOURCE_ID

            const content: ReactNode = (
              <>
                <SourceMark sourceId={route.id} size="lg" />
                <h3 className="text-foreground text-xl font-semibold">
                  {t(`${route.id}.title`)}
                </h3>
                <p className="text-muted-foreground text-sm leading-6">
                  {t(`${route.id}.description`)}
                </p>
                {isStandalone && (
                  <span className="flex flex-wrap gap-1.5">
                    {STANDALONE_CHIPS.map((chip) => (
                      <span
                        key={chip}
                        className="border-border bg-muted text-foreground inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold"
                      >
                        {t(`standalone.chips.${chip}`)}
                      </span>
                    ))}
                  </span>
                )}
                <span className="border-border text-muted-foreground mt-auto border-t pt-3 text-[0.8125rem] leading-5">
                  {isExternal ? t(`${route.id}.billing`) : t('payAsYouGo')}
                </span>
                <span className="text-primary inline-flex items-center gap-2 text-[0.9375rem] font-bold underline-offset-4 group-hover:underline">
                  {t(`${route.id}.cta`)}
                  {isExternal ? (
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    />
                  )}
                </span>
              </>
            )

            return (
              <li key={route.id}>
                {isExternal ? (
                  <a
                    href={target.href}
                    className={CARD_CLASS}
                    suppressHydrationWarning
                  >
                    {content}
                  </a>
                ) : (
                  <Link href={target.href} className={CARD_CLASS}>
                    {content}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}

export default Sources
