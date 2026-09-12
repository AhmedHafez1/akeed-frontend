'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'

const STICKY_CTA_SCROLL_THRESHOLD = 520

export function StickyMobileCta() {
  const t = useTranslations('mobile_cta')
  const { targets } = useAcquisition()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > STICKY_CTA_SCROLL_THRESHOLD)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="shadow-sticky fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur md:hidden">
      <div className="mx-auto max-w-md">
        {/*
         * The eyebrow carries the verb — the two buttons below are path names,
         * so without it they read as labels rather than actions.
         */}
        <p className="mb-2 truncate text-center text-xs font-semibold text-slate-500">
          {t('eyebrow')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <AcquisitionCta
            target={targets.shopify}
            label={t('primary_shopify')}
            ariaLabel={t('aria_shopify')}
            variant="compact"
            className="h-11 w-full px-3"
          />
          <AcquisitionCta
            target={targets.standalone}
            label={t('primary_standalone')}
            ariaLabel={t('aria_standalone')}
            variant="compactSecondary"
            className="h-11 w-full px-3"
          />
        </div>
      </div>
    </div>
  )
}
