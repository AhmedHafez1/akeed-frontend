'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import type { StandaloneSettingsModel } from '@/features/settings/domain/useStandaloneSettings'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import { akLink, akPill, notify } from '@/shared/ui'
import {
  AnnotatedSection,
  AnnotatedSections,
  settingsRowPadding,
  SwitchSetting,
} from './SettingsSection'

const logger = createLogger('Settings')

/** How long the copy button reads "Copied". */
const COPIED_FEEDBACK_MS = 2000

interface StoreTabProps {
  model: StandaloneSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

/** The connection's id, left to right, with a button that copies it. */
function ConnectionId({ identity }: { identity: string }) {
  const t = useTranslations('settings.standalone.page.store')
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(identity)
      setCopied(true)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(
        () => setCopied(false),
        COPIED_FEEDBACK_MS
      )
    } catch (error) {
      logger.error('Failed to copy the connection id', error)
      notify.error({ message: t('copyError') })
    }
  }

  return (
    <div
      className={cn(
        'border-line flex items-center justify-between gap-4 border-t',
        settingsRowPadding
      )}
    >
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-ak-caption text-ink font-semibold">
          {t('connectionId')}
        </span>
        <code
          dir="ltr"
          className="bg-neutral-soft text-ink text-ak-caption rounded-md px-1.5 py-px font-mono break-all tabular-nums"
        >
          {identity}
        </code>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className={cn(akLink, 'text-ak-caption min-h-8 cursor-pointer px-1')}
      >
        <span aria-live="polite">{copied ? t('copied') : t('copy')}</span>
      </button>
    </div>
  )
}

/**
 * Where the orders come from and how to read an order that does not say how
 * it was paid. The source is fixed by how the account was set up, so it is
 * shown, not edited.
 */
export function StoreTab({ model, data, readOnly }: StoreTabProps) {
  const t = useTranslations('settings.standalone.page.store')
  const tSettings = useTranslations('settings')
  const values = model.values
  if (!values) return null

  const { platformType, identity } = data.state.source
  const sourceName =
    platformType === 'standalone' ? tSettings('sourceStandalone') : platformType

  return (
    <AnnotatedSections>
      <AnnotatedSection
        title={tSettings('sourceHeading')}
        description={t('sourceDesc')}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-4',
            settingsRowPadding
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-neutral-soft text-ink-muted rounded-ak-control grid size-10 shrink-0 place-items-center">
              <FileText aria-hidden="true" className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-ak-body text-ink font-semibold">
                {sourceName}
              </h3>
              <p className="text-ak-caption text-ink-muted mt-0.5">
                {t('sourceHelp')}
              </p>
            </div>
          </div>
          <span className={akPill({ tone: 'brand' })}>
            <Check aria-hidden="true" className="size-3" />
            {t('connected')}
          </span>
        </div>
        <ConnectionId identity={identity} />
      </AnnotatedSection>

      <AnnotatedSection title={t('codHeading')} description={t('codDesc')}>
        <SwitchSetting
          title={t('codLabel')}
          help={t('codHelp')}
          checked={values.assumeCodWhenPaymentMissing}
          disabled={readOnly}
          onCheckedChange={(assumeCodWhenPaymentMissing) =>
            model.update({ assumeCodWhenPaymentMissing })
          }
        >
          {values.assumeCodWhenPaymentMissing && (
            <div className="px-4 pb-4 sm:px-6 sm:pb-5">
              <p className="border-ak-warning-line bg-ak-warning-soft text-ak-warning text-ak-caption rounded-ak-card flex items-start gap-2.5 border px-3.5 py-3">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{t('codRisk')}</span>
              </p>
            </div>
          )}
        </SwitchSetting>
      </AnnotatedSection>
    </AnnotatedSections>
  )
}
