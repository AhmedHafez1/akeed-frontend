'use client'

import type { FormEvent, ReactNode, Ref } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Send } from 'lucide-react'
import { fetchTemplatePreviews } from '@/features/onboarding/api/onboardingApi'
import { previewLanguageFor } from '@/features/onboarding/model/standaloneStore'
import {
  BlockedReasonsPanel,
  MessagePhonePreview,
  OnboardingField,
} from '@/features/onboarding/ui/standalone/components'
import { DEFAULT_ORDER_CURRENCY } from '@/shared/commerce/orderCommerce'
import { cn } from '@/shared/lib/utils'
import { queryKeys } from '@/shared/query/keys'
import {
  InternationalPhoneInput,
  LoadingButton,
  Skeleton,
  akCard,
  type E164Value,
} from '@/shared/ui'
import { Notice } from './connectUi'
import type { SourceSetupFlow } from './useSourceSetupFlow'

interface SourceNumberStepProps {
  setup: SourceSetupFlow
  /**
   * The source's own `checklist` messages: `loading`, `loadError`, `retry`,
   * `notReady`, `footerCaption`, `sender.*` and `automation.*`.
   */
  namespace: string
  /** Keeps element ids unique per source, e.g. `easyorders`. */
  idPrefix: string
  /** The connection line: the store this number is being set up for. */
  lead: ReactNode
  /** What the source wants seen before the number: a problem to fix first. */
  attention?: ReactNode
  /** A quiet way back to an earlier step, under the form. */
  secondaryAction?: ReactNode
  /** The currency of the sample order in the preview. */
  previewCurrency?: string | null
  headingRef: Ref<HTMLHeadingElement>
}

/**
 * Step "Your number" of a connected store: the same card as Standalone's
 * store step, asking for the one thing still missing, the WhatsApp number
 * for the free test, with how confirmations will run under it and the
 * message itself beside it. The test can be sent only once nothing blocks
 * the finish. The words come from the source skin; nothing here names a
 * platform.
 */
export function SourceNumberStep({
  setup,
  namespace,
  idPrefix,
  lead,
  attention,
  secondaryAction,
  previewCurrency,
  headingRef,
}: SourceNumberStepProps) {
  const t = useTranslations(namespace)
  const tStore = useTranslations('standaloneOnboarding.store')
  const locale = useLocale()
  const { state, phone, canManage } = setup
  const phoneFieldId = `${idPrefix}-test-phone`
  const automationId = `${idPrefix}-automation-heading`
  const isLoading = !state && !setup.loadFailed

  const previews = useQuery({
    queryKey: queryKeys.onboarding.templatePreviews(),
    queryFn: fetchTemplatePreviews,
    staleTime: Infinity,
    enabled: !!state,
  })
  const previewLanguage = previewLanguageFor({
    language: state?.defaultLanguage ?? 'auto',
    phone: phone.value,
    phoneCountry: phone.country,
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void setup.startTest()
  }

  const sender = state?.sourceSetup?.sender.status ?? 'unknown'
  const minutes = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      numberingSystem: 'latn',
    }).format(value)
  const automation = state
    ? [
        ...(sender === 'not_configured' ? [] : [t(`sender.${sender}`)]),
        state.isAutoVerifyEnabled
          ? t('automation.autoConfirmOn')
          : t('automation.autoConfirmOff'),
        state.followUpEnabled
          ? t('automation.reminderOn', {
              minutes: minutes(state.followUpDelayMinutes),
            })
          : t('automation.reminderOff'),
        state.escalationEnabled
          ? t('automation.noReplyOn', {
              minutes: minutes(state.escalationDelayMinutes),
            })
          : t('automation.noReplyOff'),
        state.quietHoursEnabled && state.quietHoursStart && state.quietHoursEnd
          ? t('automation.quietHoursOn', {
              start: state.quietHoursStart,
              end: state.quietHoursEnd,
            })
          : t('automation.quietHoursOff'),
      ]
    : []

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
      <form
        noValidate
        onSubmit={handleSubmit}
        aria-busy={isLoading || setup.isSubmitting}
        className={cn(akCard, 'overflow-hidden')}
      >
        <div className="space-y-6 p-5 text-start sm:p-8">
          {lead}

          <header className="space-y-2">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-ink text-h2 font-bold focus-visible:outline-none"
            >
              {tStore('heading')}
            </h1>
            <p className="text-ink-muted text-body">{tStore('subheading')}</p>
          </header>

          {attention}

          {setup.loadFailed ? (
            <div className="space-y-4">
              <Notice
                tone="destructive"
                icon={<AlertCircle aria-hidden="true" />}
              >
                {t('loadError')}
              </Notice>
              <LoadingButton
                type="button"
                variant="outline"
                onClick={() => void setup.retry()}
              >
                {t('retry')}
              </LoadingButton>
            </div>
          ) : !state ? (
            <div className="space-y-6">
              <span className="sr-only">{t('loading')}</span>
              <div className="space-y-2" aria-hidden="true">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <Skeleton
                aria-hidden="true"
                className="rounded-panel h-40 w-full"
              />
            </div>
          ) : (
            <>
              {sender === 'not_configured' && (
                <Notice
                  tone="destructive"
                  icon={<AlertCircle aria-hidden="true" />}
                >
                  {t('sender.not_configured')}
                </Notice>
              )}

              {setup.blockedReasons.length > 0 && (
                <BlockedReasonsPanel reasons={setup.blockedReasons} />
              )}

              <OnboardingField
                htmlFor={phoneFieldId}
                label={tStore('phone.label')}
                helpText={tStore('phone.hint')}
                error={phone.error ?? undefined}
              >
                {({ describedBy }) => (
                  <InternationalPhoneInput
                    id={phoneFieldId}
                    value={(phone.value || undefined) as E164Value | undefined}
                    defaultCountry={phone.country}
                    onChange={(value) => phone.set(value ?? '')}
                    onCountryChange={(country) => {
                      if (country) phone.setCountry(country)
                    }}
                    disabled={!canManage || setup.isSubmitting}
                    aria-invalid={!!phone.error}
                    aria-describedby={describedBy}
                    validateWhileTyping={false}
                    errorTone="warning"
                  />
                )}
              </OnboardingField>

              <section aria-labelledby={automationId} className="space-y-2">
                <h2
                  id={automationId}
                  className="text-ink text-sm font-semibold"
                >
                  {t('automation.title')}
                </h2>
                <ul className="bg-surface-sunken border-border divide-border rounded-panel divide-y border">
                  {automation.map((line) => (
                    <li key={line} className="text-ink px-4 py-3 text-sm">
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">
                  {t('automation.changeLater')}
                </p>
              </section>

              {setup.saveError && (
                <Notice
                  tone="destructive"
                  icon={<AlertCircle aria-hidden="true" />}
                >
                  {setup.saveError}
                </Notice>
              )}

              {secondaryAction}
            </>
          )}
        </div>

        <div className="border-line bg-surface-sunken flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-ink-muted text-sm" aria-live="polite">
            {isLoading
              ? t('loading')
              : setup.isReady
                ? t('footerCaption')
                : t('notReady')}
          </p>
          <LoadingButton
            type="submit"
            size="lg"
            className="w-full shrink-0 gap-2 px-6 font-semibold sm:w-auto"
            disabled={!canManage || !setup.isReady}
            loading={setup.isSubmitting}
            loadingText={tStore('submitting')}
          >
            {tStore('submit')}
            <Send aria-hidden="true" className="rtl:-scale-x-100" />
          </LoadingButton>
        </div>
      </form>

      <aside className="hidden lg:block" aria-label={tStore('preview.label')}>
        <p className="text-ink-muted mb-4 text-center text-sm font-medium">
          {tStore('preview.label')}
        </p>
        <MessagePhonePreview
          message={previews.data?.[previewLanguage] ?? null}
          isError={previews.isError}
          language={previewLanguage}
          storeName={state?.storeName ?? ''}
          currency={
            previewCurrency ?? state?.shippingCurrency ?? DEFAULT_ORDER_CURRENCY
          }
        />
      </aside>
    </div>
  )
}
