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
      <article className="border-border bg-card hover:border-input overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="divide-border divide-y px-6 text-start md:px-8">
          {sections.map((section) => (
            <section key={section.title} className="py-7 md:py-8">
              <h2 className="text-foreground text-lg font-bold">
                {section.title}
              </h2>
              <p className="text-foreground/70 mt-3 text-sm leading-relaxed sm:text-base sm:leading-8">
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
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring/40 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {primaryLinkLabel}
        </Link>
        <Link
          href={withLocale(secondaryLinkHref, locale)}
          className="hover:text-primary-hover border-border bg-card text-foreground/80 hover:border-input focus-visible:ring-ring/40 inline-flex h-11 items-center justify-center rounded-xl border px-6 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {secondaryLinkLabel}
        </Link>
      </div>
    </PublicPageShell>
  )
}
