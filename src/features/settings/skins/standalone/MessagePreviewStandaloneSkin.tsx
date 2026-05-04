'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Info, MessageCircle, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
import { Button, Card } from '@/shared/ui'

interface VariableRow {
  label: string
  value: string
}

const variableNumbers = ['1', '2', '3', '4']

export function MessagePreviewStandaloneSkin() {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<IntegrationOnboardingLanguage>('ar')
  const previewSrc =
    language === 'ar'
      ? '/images/preview/ar-prev.png'
      : '/images/preview/en-prev.png'
  const variableRows: VariableRow[] = [
    { label: t('variables.orderNumber'), value: t('values.orderNumber') },
    { label: t('variables.paymentMethod'), value: t('values.paymentMethod') },
    { label: t('variables.totalPrice'), value: t('values.totalPrice') },
    { label: t('variables.businessName'), value: t('values.businessName') },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-slate-500">{t('pageSubtitle')}</p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <Button
            type="button"
            size="sm"
            variant={language === 'ar' ? 'default' : 'ghost'}
            onClick={() => setLanguage('ar')}
          >
            {t('languageArabic')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === 'en' ? 'default' : 'ghost'}
            onClick={() => setLanguage('en')}
          >
            {t('languageEnglish')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('aboutTitle')}
              </h2>
              <Info className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mb-8 text-sm leading-6 text-slate-700">
              {t('aboutDescription')}
            </p>
            <div className="space-y-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">{t('purposeLabel')}</span>
                <span className="font-medium text-slate-800">
                  {t('purposeValue')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">{t('channelLabel')}</span>
                <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  {t('whatsappLabel')}
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {t('variablesTitle')}
            </h2>
            <div className="space-y-3">
              {variableRows.map((row, index) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[34px_1fr_minmax(112px,140px)] items-center gap-3 text-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-sm">
                    {variableNumbers[index]}
                  </span>
                  <span className="text-slate-700">{row.label}</span>
                  <span
                    dir="auto"
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-center font-semibold text-emerald-700 [unicode-bidi:isolate]"
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('trustTitle')}
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  {t('trustNote')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {t('previewHeading')}
          </h2>
          <div className="flex min-h-[580px] items-start justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <PhoneImagePreview src={previewSrc} alt={t('imageAlt')} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function PhoneImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full max-w-[340px] rounded-[2.75rem] border-[10px] border-slate-950 bg-slate-950 shadow-xl">
      <div className="absolute top-4 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="overflow-hidden rounded-[2.05rem] bg-white">
        <div className="flex h-11 items-center justify-between px-6 text-xs font-semibold text-slate-950">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-[2px] border border-slate-950" />
            <span className="h-2 w-2 rounded-full bg-slate-950" />
          </span>
        </div>
        <div className="max-h-[560px] overflow-hidden bg-white">
          <Image
            src={src}
            alt={alt}
            width={1024}
            height={1134}
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  )
}
