'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  Info,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Target,
  X,
} from 'lucide-react'
import type {
  ArabicCodTemplateVariantId,
  EnglishCodTemplateVariantId,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import {
  formatTemplatePreviewTimestamp,
  getTemplatePreviewParagraphs,
  getTemplatePreviewVariableKeys,
} from '@/features/settings/skins/shared/templatePreview'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'

type TemplateLanguage = 'ar' | 'en'

interface TemplatesStandaloneSkinProps {
  props: SettingsSkinProps
}

function TemplateSaveStatus({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings.standalone.saveState')

  if (props.isSaving) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm text-slate-600"
      >
        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        {t('saving')}
      </span>
    )
  }

  if (props.saveFailed && props.isDirty) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-semibold text-red-700"
      >
        <AlertCircle aria-hidden="true" className="h-4 w-4" />
        {t('failed')}
      </span>
    )
  }

  if (props.isDirty) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700"
      >
        <Clock3 aria-hidden="true" className="h-4 w-4" />
        {t('unsaved')}
      </span>
    )
  }

  if (!props.successBanner) return null

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
    >
      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
      {t('saved')}
    </span>
  )
}

export function TemplatesStandaloneSkin({
  props,
}: TemplatesStandaloneSkinProps) {
  const t = useTranslations('messageTemplate.standalone')
  const { locale } = useLocaleInfo()
  const initialLanguage =
    props.defaultLanguage === 'ar' || props.defaultLanguage === 'en'
      ? props.defaultLanguage
      : props.defaultTemplateLanguage
  const [previewLanguage, setPreviewLanguage] =
    useState<TemplateLanguage>(initialLanguage)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const selectedVariant = props.selectedCodTemplateVariants[previewLanguage]
  const savedVariant = props.savedCodTemplateVariants[previewLanguage]
  const availableVariants = props.codTemplateVariants[previewLanguage]
  const selectedDefinition = availableVariants.find(
    (definition) => definition.variant === selectedVariant
  )
  const template =
    selectedDefinition?.preview ?? props.templatePreviews[previewLanguage]
  const previewParagraphs = getTemplatePreviewParagraphs(
    template,
    props.storeName
  )
  const variableKeys = getTemplatePreviewVariableKeys(
    selectedDefinition?.bodyParameterOrder
  )
  const defaultVariant = props.codTemplateDefaults[previewLanguage]
  const isDefaultVariant = selectedVariant === defaultVariant
  const isActiveLanguageDirty = selectedVariant !== savedVariant
  const canReset =
    props.canUpdateConfiguration &&
    !props.isSaving &&
    !isDefaultVariant &&
    availableVariants.some(
      (definition) => definition.variant === defaultVariant
    )
  const storeDefaultLanguage =
    props.defaultLanguage === 'ar' || props.defaultLanguage === 'en'
      ? props.defaultLanguage
      : props.defaultTemplateLanguage
  const storeLanguageLabel =
    props.defaultLanguage === 'ar'
      ? t('languageArabic')
      : props.defaultLanguage === 'en'
        ? t('languageEnglish')
        : t('languageAuto')

  const handleVariantChange = (value: string) => {
    if (previewLanguage === 'ar') {
      props.onCodTemplateArVariantChange(value as ArabicCodTemplateVariantId)
      return
    }

    props.onCodTemplateEnVariantChange(value as EnglishCodTemplateVariantId)
  }

  const resetToDefault = () => {
    handleVariantChange(defaultVariant)
    setIsResetDialogOpen(false)
  }

  const requestReset = () => {
    if (isActiveLanguageDirty) {
      setIsResetDialogOpen(true)
      return
    }

    resetToDefault()
  }

  const languageLabel = (language: TemplateLanguage) =>
    language === 'ar' ? t('languageArabic') : t('languageEnglish')

  return (
    <div className={cn('mx-auto max-w-7xl', props.isDirty && 'pb-24 md:pb-8')}>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-2xl font-bold text-slate-950">
            {t('pageTitle')}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {t('pageSubtitle')}
          </p>
        </div>
        <TemplateSaveStatus props={props} />
      </header>

      {props.errorBanner && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {props.errorBanner}
        </div>
      )}

      {props.successBanner && !props.isDirty && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {props.successBanner}
        </div>
      )}

      {!props.canUpdateConfiguration && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t('readOnly')}
        </div>
      )}

      <Card className="mb-5 border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Globe2 aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-950">
              {t('storeLanguageTitle', { language: storeLanguageLabel })}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {props.defaultLanguage === 'auto'
                ? t('storeLanguageAutoDescription')
                : t('storeLanguageFixedDescription', {
                    language: storeLanguageLabel,
                  })}
            </p>
          </div>
          <Link
            href={withLocale('/settings?section=general', locale)}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t('changeInSettings')}
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 rtl:rotate-180"
            />
          </Link>
        </div>
      </Card>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,58fr)_minmax(320px,42fr)]">
        <div className="space-y-4">
          <Card className="border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <fieldset>
              <legend className="text-base font-semibold text-slate-950">
                {t('customerLanguageTitle')}
              </legend>
              <div
                role="tablist"
                aria-label={t('customerLanguageTitle')}
                className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-1"
              >
                {props.templateLanguages.map((language) => {
                  const isSelected = previewLanguage === language
                  const isStoreDefault = storeDefaultLanguage === language

                  return (
                    <button
                      key={language}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setPreviewLanguage(language)}
                      className={cn(
                        'flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:outline-none',
                        isSelected
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-950'
                      )}
                    >
                      {languageLabel(language)}
                      {isStoreDefault && (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          {t('defaultBadge')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {t('perLanguageStyleHint')}
              </p>
            </fieldset>
          </Card>

          <Card className="border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <fieldset
              disabled={!props.canUpdateConfiguration || props.isSaving}
            >
              <legend className="text-base font-semibold text-slate-950">
                {t('toneTitle')}
              </legend>
              <p className="mt-1 text-sm text-slate-600">
                {t('toneDescription')}
              </p>

              {availableVariants.length > 0 ? (
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {availableVariants.map((definition) => {
                    const isSelected = definition.variant === selectedVariant
                    const isDefault = definition.variant === defaultVariant
                    const inputId = `${previewLanguage}-${definition.variant}`

                    return (
                      <label
                        key={definition.variant}
                        htmlFor={inputId}
                        className={cn(
                          'relative flex min-h-20 cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50',
                          (!props.canUpdateConfiguration || props.isSaving) &&
                            'cursor-not-allowed opacity-65'
                        )}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={`template-variant-${previewLanguage}`}
                          value={definition.variant}
                          checked={isSelected}
                          onChange={(event) =>
                            handleVariantChange(event.target.value)
                          }
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-stone-300 bg-white text-transparent'
                          )}
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-950">
                            {t(`variantLabels.${definition.variant}`)}
                            {isDefault && (
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                {t('defaultBadge')}
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">
                            {t(`variantDescriptions.${definition.variant}`)}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-sm text-slate-600">
                  {t('noVariants')}
                </p>
              )}
            </fieldset>
          </Card>

          <Card className="border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-950">
              {t('detailsTitle')}
            </h2>
            <dl className="mt-4 overflow-hidden rounded-xl border border-stone-200">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 border-b border-stone-200 px-4 py-3 text-sm">
                <dt className="flex items-center gap-2 text-slate-600">
                  <MessageCircle
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-700"
                  />
                  {t('channelLabel')}
                </dt>
                <dd className="font-medium text-slate-950">
                  {t('whatsappLabel')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 border-b border-stone-200 px-4 py-3 text-sm">
                <dt className="flex items-center gap-2 text-slate-600">
                  <Target
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-700"
                  />
                  {t('purposeLabel')}
                </dt>
                <dd className="font-medium text-slate-950">
                  {t('purposeValue')}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 px-4 py-3 text-sm">
                <dt className="flex items-center gap-2 text-slate-600">
                  <Braces
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-700"
                  />
                  {t('variablesTitle')}
                </dt>
                <dd className="flex flex-wrap gap-1.5 font-medium text-slate-950">
                  {variableKeys.length > 0
                    ? variableKeys.map((variable) => (
                        <span
                          key={variable}
                          className="rounded-md bg-stone-100 px-2 py-1 text-xs"
                        >
                          {t(`variableLabels.${variable}`)}
                        </span>
                      ))
                    : t('variablesUnavailable')}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-900">
              <Info
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
              />
              <p>{t('approvalDescription')}</p>
            </div>
          </Card>

          {props.canUpdateConfiguration && (
            <div className="hidden items-center justify-end gap-3 border-t border-stone-200 pt-4 md:flex">
              <Button
                type="button"
                variant="outline"
                disabled={!canReset}
                onClick={requestReset}
                className="h-11 border-emerald-700 px-5 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
              >
                <RotateCcw aria-hidden="true" />
                {t('resetButton')}
              </Button>
              <Button
                type="button"
                disabled={!props.isDirty || props.isSaving}
                onClick={() => void props.onSave()}
                className="h-11 bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              >
                {props.isSaving ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {props.isSaving ? t('savingButton') : t('saveButton')}
              </Button>
            </div>
          )}
        </div>

        <Card className="border-stone-200 bg-white p-4 shadow-sm sm:p-5 md:sticky md:top-20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">
              {t('customerPreviewTitle')}
            </h2>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {t('livePreviewBadge')}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-[#e2ded6] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center p-4 sm:p-6">
            <div
              dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
              lang={previewLanguage}
              style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
              className="mx-auto max-w-[390px]"
            >
              <div className="relative rounded-xl bg-white px-4 pt-4 pb-3 text-[#1f2933] shadow-[0_1px_2px_rgba(15,23,42,0.14)] before:absolute before:start-[-7px] before:top-0 before:border-e-[10px] before:border-t-[12px] before:border-e-transparent before:border-t-white">
                <div className="space-y-3 text-[15px] leading-6">
                  {previewParagraphs.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`}>{paragraph}</p>
                  ))}
                </div>
                <p
                  className={cn(
                    'mt-2 text-[11px] text-[#8a9197]',
                    previewLanguage === 'ar' ? 'text-left' : 'text-right'
                  )}
                >
                  {formatTemplatePreviewTimestamp(previewLanguage)}
                </p>
              </div>

              <div className="mt-3 space-y-2" aria-label={t('previewActions')}>
                <div
                  aria-disabled="true"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#008f67] px-4 text-sm font-semibold text-white shadow-sm"
                >
                  <Check aria-hidden="true" className="h-4 w-4" />
                  {template.confirmButton}
                </div>
                <div
                  aria-disabled="true"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#008f67] bg-white px-4 text-sm font-semibold text-[#007a58] shadow-sm"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                  {template.cancelButton}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-5 text-slate-600">
            {t('previewFooter')}
          </p>
        </Card>
      </div>

      {props.canUpdateConfiguration && props.isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!canReset}
              onClick={requestReset}
              className="h-11 flex-1 border-emerald-700 text-emerald-800"
            >
              <RotateCcw aria-hidden="true" />
              {t('resetButton')}
            </Button>
            <Button
              type="button"
              disabled={props.isSaving}
              onClick={() => void props.onSave()}
              className="h-11 flex-1 bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {props.isSaving ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {props.isSaving ? t('savingButton') : t('saveButton')}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent closeLabel={t('resetDialog.closeLabel')}>
          <DialogHeader>
            <DialogTitle>{t('resetDialog.title')}</DialogTitle>
            <DialogDescription className="leading-6">
              {t('resetDialog.description', {
                language: languageLabel(previewLanguage),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
            >
              {t('resetDialog.cancel')}
            </Button>
            <Button
              type="button"
              onClick={resetToDefault}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {t('resetDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
