'use client'

import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Check, Circle, Send } from 'lucide-react'
import {
  BlockedReasonsPanel,
  OnboardingField,
} from '@/features/onboarding/ui/standalone/components'
import { cn } from '@/shared/lib/utils'
import {
  InternationalPhoneInput,
  LoadingButton,
  Skeleton,
  akCard,
  type E164Value,
} from '@/shared/ui'
import { Notice } from './connectUi'
import type { SourceSetupFlow } from './useSourceSetupFlow'

interface SourceSetupChecklistProps {
  setup: SourceSetupFlow
  /**
   * The source's own `checklist` messages: `title`, `body`, `loading`,
   * `loadError`, `retry`, `done`, `todo`, `notReady`, `items.<id>.*`,
   * `sender.*` and `automation.*`.
   */
  namespace: string
  /** Keeps element ids unique per source, e.g. `easyorders`. */
  idPrefix: string
}

/**
 * The last card of a connected store's screen: what is ready, what is still
 * needed, how messages will be sent, and the number for the free test. The
 * test can be sent only once every row is done. The rows and the words come
 * from the source skin; nothing here names a platform.
 */
export function SourceSetupChecklist({
  setup,
  namespace,
  idPrefix,
}: SourceSetupChecklistProps) {
  const t = useTranslations(namespace)
  const tStore = useTranslations('standaloneOnboarding.store')
  const locale = useLocale()
  const { state, checklist, phone, canManage } = setup
  const headingId = `${idPrefix}-checklist-heading`
  const phoneFieldId = `${idPrefix}-test-phone`

  if (setup.loadFailed) {
    return (
      <section className={cn(akCard, 'space-y-4 p-6 text-start sm:p-8')}>
        <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
          {t('loadError')}
        </Notice>
        <LoadingButton variant="outline" onClick={() => void setup.retry()}>
          {t('retry')}
        </LoadingButton>
      </section>
    )
  }

  if (!state) {
    return (
      <section aria-busy="true" className={cn(akCard, 'space-y-3 p-6 sm:p-8')}>
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="h-24 w-full" />
      </section>
    )
  }

  const sender = state.sourceSetup?.sender.status ?? 'unknown'
  const minutes = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      numberingSystem: 'latn',
    }).format(value)
  const automation = [
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

  return (
    <section
      aria-labelledby={headingId}
      className={cn(akCard, 'space-y-6 p-6 text-start sm:p-8')}
    >
      <div className="space-y-1">
        <h2 id={headingId} className="text-ink text-lg font-bold">
          {t('title')}
        </h2>
        <p className="text-ink-muted text-sm">{t('body')}</p>
      </div>

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li key={item.id} className="flex items-start gap-3 text-sm">
            {item.done ? (
              <Check
                aria-hidden="true"
                className="text-primary mt-0.5 size-4 shrink-0"
              />
            ) : (
              <Circle
                aria-hidden="true"
                className="text-ink-muted mt-0.5 size-4 shrink-0"
              />
            )}
            <span>
              <span className="text-ink font-semibold">
                {t(`items.${item.id}.title`)}
              </span>
              <span className="sr-only">
                {' '}
                ({item.done ? t('done') : t('todo')})
              </span>
              <span className="text-ink-muted block">
                {item.id === 'sender'
                  ? t(`sender.${sender}`)
                  : t(`items.${item.id}.${item.done ? 'done' : 'todo'}`)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <h3 className="text-ink text-sm font-semibold">
          {t('automation.title')}
        </h3>
        <ul className="text-ink-muted list-disc space-y-1 ps-5 text-sm">
          {automation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-ink-muted text-sm">{t('automation.changeLater')}</p>
      </div>

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

      {setup.saveError && (
        <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
          {setup.saveError}
        </Notice>
      )}

      <div className="space-y-2">
        <LoadingButton
          size="lg"
          className="w-full gap-2 px-8 font-semibold sm:w-auto"
          disabled={!canManage || !setup.isReady}
          loading={setup.isSubmitting}
          loadingText={tStore('submitting')}
          onClick={() => void setup.startTest()}
        >
          <Send aria-hidden="true" className="rtl:-scale-x-100" />
          {tStore('submit')}
        </LoadingButton>
        {!setup.isReady && (
          <p className="text-ink-muted text-sm">{t('notReady')}</p>
        )}
      </div>
    </section>
  )
}
