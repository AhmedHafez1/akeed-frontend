import Link from 'next/link'
import { withLocale } from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { PublicPageShell } from './PublicPageShell'

interface LegalSection {
  title: string
  body: string
}

interface LegalDocumentPageProps {
  eyebrow: string
  title: string
  lastUpdated: string
  companyLine: string
  intro: string
  sections: LegalSection[]
  locale: SupportedLocale
  primaryLinkLabel: string
  secondaryLinkHref: string
  secondaryLinkLabel: string
  isRTL: boolean
}

export function LegalDocumentPage({
  eyebrow,
  title,
  lastUpdated,
  companyLine,
  intro,
  sections,
  locale,
  primaryLinkLabel,
  secondaryLinkHref,
  secondaryLinkLabel,
  isRTL,
}: LegalDocumentPageProps) {
  return (
    <PublicPageShell
      eyebrow={eyebrow}
      title={title}
      meta={lastUpdated}
      description={intro}
    >
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-5 text-center md:px-8">
          <p className="text-sm leading-7 font-medium text-slate-600">
            {companyLine}
          </p>
        </div>

        <div className="divide-y divide-slate-200/80 px-5 text-start md:px-8">
          {sections.map((section) => (
            <section key={section.title} className="py-6 md:py-7">
              <h2 className="text-xl leading-8 font-bold text-slate-900">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-8 text-slate-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>

      <div
        className={cn(
          'mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center',
          isRTL && 'sm:flex-row-reverse'
        )}
      >
        <Link
          href={withLocale('/', locale)}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
        >
          {primaryLinkLabel}
        </Link>
        <Link
          href={withLocale(secondaryLinkHref, locale)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          {secondaryLinkLabel}
        </Link>
      </div>
    </PublicPageShell>
  )
}
