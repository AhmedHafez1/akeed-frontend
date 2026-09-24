'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  Braces,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  Info,
  Eye,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Target,
} from 'lucide-react'
import type {
  ArabicCodTemplateVariantId,
  EnglishCodTemplateVariantId,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import {
  getTemplatePreviewParagraphs,
  getTemplatePreviewVariableKeys,
} from '@/features/settings/skins/shared/templatePreview'
import { TemplatePhonePreview } from '@/features/settings/skins/shared/TemplatePhonePreview'
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
  notify,
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
        className="text-foreground/70 inline-flex items-center gap-2 text-sm"
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
        className="text-destructive-subtle-foreground inline-flex items-center gap-2 text-sm font-semibold"
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
        className="text-warning inline-flex items-center gap-2 text-sm font-semibold"
      >
        <Clock3 aria-hidden="true" className="h-4 w-4" />
        {t('unsaved')}
      </span>
    )
  }

  return null
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    if (!props.successBanner || props.isDirty) return
    notify.success({
      message: props.successBanner,
      id: 'template-save-success',
    })
  }, [props.isDirty, props.successBanner])

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
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-foreground text-2xl font-bold">
            {t('pageTitle')}
          </h1>
          <p className="text-foreground/70 max-w-2xl text-sm leading-6">
            {t('pageSubtitle')}
          </p>
        </div>
        <TemplateSaveStatus props={props} />
      </header>

      {props.errorBanner && (
        <div
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground mb-5 rounded-xl border px-4 py-3 text-sm"
        >
          {props.errorBanner}
        </div>
      )}

      {!props.canUpdateConfiguration && (
        <div
          role="status"
          className="border-warning-border bg-warning-subtle text-warning-subtle-foreground mb-5 rounded-xl border px-4 py-3 text-sm"
        >
          {t('readOnly')}
        </div>
      )}

      <Card className="mb-5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-muted/50 text-foreground/80 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Globe2 aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-semibold">
              {t('storeLanguageTitle', { language: storeLanguageLabel })}
            </p>
          </div>
          <Link
            href={withLocale('/settings?section=general', locale)}
            className="text-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:ring-ring inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t('changeInSettings')}
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 rtl:rotate-180"
            />
          </Link>
        </div>
      </Card>

      <Button
        type="button"
        variant="outline"
        onClick={() => setIsPreviewOpen(true)}
        className="border-input text-foreground mb-4 h-11 w-full md:hidden"
      >
        <Eye aria-hidden="true" />
        {t('customerPreviewTitle')}
      </Button>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,58fr)_minmax(320px,42fr)]">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <fieldset>
              <legend className="text-foreground text-base font-semibold">
                {t('customerLanguageTitle')}
              </legend>
              <div
                role="tablist"
                aria-label={t('customerLanguageTitle')}
                className="border-border bg-muted mt-4 grid grid-cols-2 overflow-hidden rounded-xl border p-1"
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
                        'focus-visible:ring-ring flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
                        isSelected
                          ? 'bg-muted text-foreground shadow-sm'
                          : 'text-foreground/70 hover:bg-card hover:text-foreground'
                      )}
                    >
                      {languageLabel(language)}
                      {isStoreDefault && (
                        <span className="bg-primary-subtle text-primary-subtle-foreground rounded-md px-1.5 py-0.5 text-[11px] font-semibold">
                          {t('defaultBadge')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-muted-foreground mt-3 text-xs leading-5">
                {t('perLanguageStyleHint')}
              </p>
            </fieldset>
          </Card>

          <Card className="p-4 sm:p-5">
            <fieldset
              disabled={!props.canUpdateConfiguration || props.isSaving}
            >
              <legend className="text-foreground text-base font-semibold">
                {t('toneTitle')}
              </legend>
              <p className="text-foreground/70 mt-1 text-sm">
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
                          'focus-within:ring-ring relative flex min-h-20 cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-offset-2',
                          isSelected
                            ? 'bg-muted border-transparent'
                            : 'border-border hover:border-input hover:bg-muted bg-card',
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
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-input bg-card text-transparent'
                          )}
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                        <span className="min-w-0">
                          <span className="text-foreground flex flex-wrap items-center gap-2 text-sm font-semibold">
                            {t(`variantLabels.${definition.variant}`)}
                            {isDefault && (
                              <span className="bg-primary-subtle text-primary-subtle-foreground rounded-md px-1.5 py-0.5 text-[11px] font-semibold">
                                {t('defaultBadge')}
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <span className="text-foreground/70 mt-1 block text-xs leading-5">
                              {t(`variantDescriptions.${definition.variant}`)}
                            </span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="bg-muted text-foreground/70 mt-4 rounded-xl px-4 py-3 text-sm">
                  {t('noVariants')}
                </p>
              )}
            </fieldset>
          </Card>

          <details className="border-border bg-card rounded-card border">
            <summary className="text-foreground cursor-pointer px-4 py-4 text-base font-semibold sm:px-5">
              {t('detailsTitle')}
            </summary>
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <dl className="border-border rounded-card mt-4 overflow-hidden border">
                <div className="border-border grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 border-b px-4 py-3 text-sm">
                  <dt className="text-foreground/70 flex items-center gap-2">
                    <MessageCircle
                      aria-hidden="true"
                      className="text-primary h-4 w-4"
                    />
                    {t('channelLabel')}
                  </dt>
                  <dd className="text-foreground font-medium">
                    {t('whatsappLabel')}
                  </dd>
                </div>
                <div className="border-border grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 border-b px-4 py-3 text-sm">
                  <dt className="text-foreground/70 flex items-center gap-2">
                    <Target
                      aria-hidden="true"
                      className="text-primary h-4 w-4"
                    />
                    {t('purposeLabel')}
                  </dt>
                  <dd className="text-foreground font-medium">
                    {t('purposeValue')}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 px-4 py-3 text-sm">
                  <dt className="text-foreground/70 flex items-center gap-2">
                    <Braces
                      aria-hidden="true"
                      className="text-primary h-4 w-4"
                    />
                    {t('variablesTitle')}
                  </dt>
                  <dd className="text-foreground flex flex-wrap gap-1.5 font-medium">
                    {variableKeys.length > 0
                      ? variableKeys.map((variable) => (
                          <span
                            key={variable}
                            className="bg-muted rounded-md px-2 py-1 text-xs"
                          >
                            {t(`variableLabels.${variable}`)}
                          </span>
                        ))
                      : t('variablesUnavailable')}
                  </dd>
                </div>
              </dl>
              <div className="bg-primary-subtle text-primary-subtle-foreground mt-3 flex gap-3 rounded-xl px-4 py-3 text-sm leading-5">
                <Info
                  aria-hidden="true"
                  className="text-primary mt-0.5 h-4 w-4 shrink-0"
                />
                <p>{t('approvalDescription')}</p>
              </div>
            </div>
          </details>

          {props.canUpdateConfiguration && (
            <div className="border-border hidden items-center justify-end gap-3 border-t pt-4 md:flex">
              <Button
                type="button"
                variant="outline"
                disabled={!canReset}
                onClick={requestReset}
                className="border-primary text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground h-11 px-5"
              >
                <RotateCcw aria-hidden="true" />
                {t('resetButton')}
              </Button>
              <Button
                type="button"
                disabled={!props.isDirty || props.isSaving}
                onClick={() => void props.onSave()}
                className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 px-5"
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

        <Card className="hidden p-4 sm:p-5 md:sticky md:top-20 md:block">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-foreground text-base font-semibold">
              {t('customerPreviewTitle')}
            </h2>
            <span className="bg-primary-subtle text-primary rounded-lg px-2.5 py-1 text-xs font-semibold">
              {t('livePreviewBadge')}
            </span>
          </div>

          <div className="mt-4">
            <TemplatePhonePreview
              language={previewLanguage}
              paragraphs={previewParagraphs}
              confirmButton={template.confirmButton}
              cancelButton={template.cancelButton}
            />
          </div>
        </Card>
      </div>

      {props.canUpdateConfiguration && props.isDirty && (
        <div className="border-border shadow-sticky bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!canReset}
              onClick={requestReset}
              className="border-primary text-primary-subtle-foreground h-11 flex-1"
            >
              <RotateCcw aria-hidden="true" />
              {t('resetButton')}
            </Button>
            <Button
              type="button"
              disabled={props.isSaving}
              onClick={() => void props.onSave()}
              className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 flex-1"
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
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              {t('resetDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          closeLabel={t('resetDialog.closeLabel')}
          className="max-h-[92dvh] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>{t('customerPreviewTitle')}</DialogTitle>
            <DialogDescription>
              {languageLabel(previewLanguage)}
            </DialogDescription>
          </DialogHeader>
          <TemplatePhonePreview
            language={previewLanguage}
            paragraphs={previewParagraphs}
            confirmButton={template.confirmButton}
            cancelButton={template.cancelButton}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
