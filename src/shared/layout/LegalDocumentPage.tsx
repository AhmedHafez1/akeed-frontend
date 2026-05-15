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
      contentClassName="mx-auto max-w-3xl"
    >
      <article className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md">
        <div className="border-b border-emerald-100 bg-emerald-50/50 px-6 py-5 text-center md:px-8">
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            {companyLine}
          </p>
        </div>

        <div className="divide-y divide-slate-100 px-6 text-start md:px-8">
          {sections.map((section) => (
            <section key={section.title} className="py-7 md:py-8">
              <h2 className="text-lg font-bold text-slate-800">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-8">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>

      <div
        className={cn(
          'mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center',
          isRTL && 'sm:flex-row-reverse'
        )}
      >
        <Link
          href={withLocale('/', locale)}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {primaryLinkLabel}
        </Link>
        <Link
          href={withLocale(secondaryLinkHref, locale)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-100 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {secondaryLinkLabel}
        </Link>
      </div>
    </PublicPageShell>
  )
}
