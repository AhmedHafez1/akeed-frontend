'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  getStartRoutes,
  type StartRoute,
} from '@/shared/config/commerceSources'
import { auth } from '@/shared/lib/auth'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import { SourceMark } from '@/shared/ui'
import { buildSourceSearch } from './signup.model'

interface SignupSourceStepProps {
  locale: string
  /** Start routes to list; Shopify and no connected store are always there. */
  routes?: readonly StartRoute[]
}

const ROW_CLASS =
  'ak-focus rounded-ak-card border-line-strong bg-surface-raised text-ink hover:border-brand hover:bg-brand-soft group flex min-h-22 w-full items-center gap-4 border px-4 py-3.5 text-start motion-safe:transition-colors motion-safe:duration-150 sm:px-5'

const LINK_CLASS =
  'text-primary hover:text-primary-hover font-semibold underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'

const TRAILING_ICON_CLASS =
  'text-ink-muted group-hover:text-brand-ink size-5 shrink-0'

/**
 * Step 1 of signup: where the orders come from. Every row is a link, so the
 * choice lives in the URL. Shopify leaves for the App Store, where its
 * merchants install the app and never need an account here.
 */
export function SignupSourceStep({
  locale,
  routes = getStartRoutes(),
}: SignupSourceStepProps) {
  const t = useTranslations('auth.signup')

  const rowBody = (title: string, description: string, icon: ReactNode) => (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="text-ink-muted mt-0.5 block text-sm">
          {description}
        </span>
      </span>
      {icon}
    </>
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 text-start">
        <h1 className="text-ink text-h2 font-bold">{t('source.heading')}</h1>
        <p className="text-ink-muted text-sm">{t('source.subtitle')}</p>
      </header>

      <nav aria-label={t('source.summaryLabel')}>
        <ul className="space-y-3">
          {routes.map((route) => (
            <li key={route.id}>
              {route.kind === 'external' ? (
                <a href={SHOPIFY_APP_STORE_LISTING_URL} className={ROW_CLASS}>
                  <SourceMark sourceId={route.id} />
                  {rowBody(
                    t('source.shopifyTitle'),
                    t('source.shopifyRow'),
                    <ExternalLink
                      aria-hidden="true"
                      className={TRAILING_ICON_CLASS}
                    />
                  )}
                </a>
              ) : (
                <Link href={buildSourceSearch(route.id)} className={ROW_CLASS}>
                  <SourceMark sourceId={route.id} />
                  {rowBody(
                    t(`source.options.${route.id}.title`),
                    t(`source.options.${route.id}.description`),
                    <ChevronRight
                      aria-hidden="true"
                      className={`${TRAILING_ICON_CLASS} rtl:rotate-180`}
                    />
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-ink-muted text-center text-sm">
        {t('haveAccount')}{' '}
        <Link href={auth.getLoginPath(locale)} className={LINK_CLASS}>
          {t('signIn')}
        </Link>
      </p>
    </div>
  )
}
