'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
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
    <div className="shadow-sticky border-border bg-card/95 fixed inset-x-0 bottom-0 z-50 border-t px-3 py-3 backdrop-blur md:hidden">
      {/* The hero's two actions, kept in reach once it has scrolled away. */}
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
        <AcquisitionCta
          target={targets.standalone}
          label={t('start')}
          variant="compact"
          className="h-12 w-full px-3"
        />
        <AcquisitionCta
          target={targets.shopify}
          label={t('shopify')}
          variant="compactSecondary"
          className="h-12 w-full px-3"
          leading={
            <Image
              src="/images/landing/logos/shopify_icon_1.png"
              alt=""
              width={20}
              height={20}
              unoptimized
              className="h-5 w-5 shrink-0 object-contain"
            />
          }
        />
      </div>
    </div>
  )
}
