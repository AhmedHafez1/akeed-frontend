'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { DocPagerItem } from '@/features/docs/model/docs.model'

interface DocsPagerProps {
  previous: DocPagerItem | null
  next: DocPagerItem | null
}

export function DocsPager({ previous, next }: DocsPagerProps) {
  const t = useTranslations('docs')
  const { isRTL } = useLocaleInfo()

  if (!previous && !next) {
    return null
  }

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Link
          href={previous.href}
          className="group rounded-xl border border-emerald-100 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-sm"
        >
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t('previous')}
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{previous.title}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group rounded-xl border border-emerald-100 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-sm"
        >
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t('next')}
          </p>
          <div className="mt-1 flex items-center justify-end gap-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
            <span>{next.title}</span>
            {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </div>
        </Link>
      ) : null}
    </div>
  )
}
