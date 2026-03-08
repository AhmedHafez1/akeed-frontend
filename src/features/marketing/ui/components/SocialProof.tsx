'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'

export function SocialProof() {
  const t = useTranslations('hero')

  return (
    <div className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-white/70 p-2 pe-4 shadow-lg shadow-emerald-200/10 backdrop-blur-lg transition-all hover:scale-105 hover:bg-white sm:pe-5 lg:px-4 lg:py-4">
      <div className="flex -space-x-3 ps-1">
        {[1, 2, 3, 4].map((num) => (
          <Image
            key={num}
            src={`/images/landing/${num}.jpg`}
            alt="User"
            width={28}
            height={28}
            className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-xs sm:h-8 sm:w-8 lg:h-10 lg:w-10"
          />
        ))}
      </div>

      <div className="h-4 w-px bg-slate-200/60" />

      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-xs text-slate-600 lg:text-sm">
          {t.rich('join_social_proof', {
            bold: (chunks) => (
              <span className="font-bold text-slate-900">{chunks}</span>
            ),
          })}
        </span>
      </div>
    </div>
  )
}
