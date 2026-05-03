'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
import { Button, Card } from '@/shared/ui'

export function MessagePreviewStandaloneSkin() {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<IntegrationOnboardingLanguage>('ar')
  const previewSrc =
    language === 'ar'
      ? '/images/Preview/ar-preview-light.png'
      : '/images/Preview/en-preview-light.png'

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-slate-500">{t('pageSubtitle')}</p>
      </div>

      <Card className="border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant={language === 'ar' ? 'default' : 'outline'}
              onClick={() => setLanguage('ar')}
            >
              {t('languageArabic')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => setLanguage('en')}
            >
              {t('languageEnglish')}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 sm:p-6">
            <div className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Image
                src={previewSrc}
                alt={t('imageAlt')}
                width={1200}
                height={750}
                className="h-auto w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{t('trustNote')}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
