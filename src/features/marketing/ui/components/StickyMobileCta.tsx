'use client'

import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

export function StickyMobileCta() {
  const t = useTranslations('mobile_cta')
  const router = useRouter()
  const { locale } = useLocaleInfo()

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200/80 bg-white/95 px-3 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-500">
            {t('eyebrow')}
          </p>
          <p className="truncate text-sm font-bold text-slate-800">
            {t('title')}
          </p>
        </div>
        <button
          onClick={() => router.push(withLocale('/signup', locale))}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-linear-to-r from-orange-600 to-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
          suppressHydrationWarning
        >
          {t('primary')}
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
