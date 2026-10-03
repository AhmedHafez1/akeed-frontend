'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, FileText, Unplug } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import { resolveSettingsSourceSkin } from '@/features/settings/domain/sourceSkins'
import { useCopyToClipboard } from '@/features/settings/domain/useCopyToClipboard'
import type { StandaloneSettingsModel } from '@/features/settings/domain/useStandaloneSettings'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import { queryKeys } from '@/shared/query/keys'
import { akLink, akPill, notify } from '@/shared/ui'
import {
  AnnotatedSection,
  AnnotatedSections,
  settingsRowPadding,
  settingsRowTitle,
  SwitchSetting,
} from './SettingsSection'
import { SourceHealthCard } from './SourceHealthCard'

const logger = createLogger('Settings')

interface StoreTabProps {
  model: StandaloneSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

/** The connection's id, left to right, with a button that copies it. */
function ConnectionId({ identity }: { identity: string }) {
  const t = useTranslations('settings.standalone.page.store')
  const { copied, copy } = useCopyToClipboard((error) => {
    logger.error('Failed to copy the connection id', error)
    notify.error({ message: t('copyError') })
  })

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
          className="bg-neutral-soft text-ink text-ak-label rounded-md px-1.5 py-px font-mono font-normal break-all tabular-nums"
        >
          {identity}
        </code>
      </div>
      <button
        type="button"
        onClick={() => void copy(identity)}
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
 * shown, not edited; a source the merchant connects also gets its connection
 * controls and its health, chosen by platform in `sourceSkins`.
 */
export function StoreTab({ model, data, readOnly }: StoreTabProps) {
  const t = useTranslations('settings.standalone.page.store')
  const tSettings = useTranslations('settings')
  const queryClient = useQueryClient()
  // The connection moved (disconnect, reconnect, new secrets): the state and
  // the health shown here are stale.
  const refreshSource = useCallback(
    () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
    [queryClient]
  )
  const values = model.values
  if (!values) return null

  const { platformType, identity } = data.state.source
  const skin = resolveSettingsSourceSkin(platformType)
  const sourceName = skin ? tSettings(skin.nameKey) : platformType
  const disconnected =
    data.state.sourceSetup?.connectionState === 'disconnected'
  const SourcePanel = skin?.Panel

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
              <h3 className={settingsRowTitle}>{sourceName}</h3>
              <p className="text-ak-caption text-ink-muted mt-0.5">
                {t(skin?.helpKey ?? 'sourceHelp')}
              </p>
            </div>
          </div>
          {disconnected ? (
            <span className={akPill({ tone: 'neutral' })}>
              <Unplug aria-hidden="true" className="size-3" />
              {t('disconnected')}
            </span>
          ) : (
            <span className={akPill({ tone: 'brand' })}>
              <Check aria-hidden="true" className="size-3" />
              {t('connected')}
            </span>
          )}
        </div>
        <ConnectionId identity={identity} />
      </AnnotatedSection>

      {SourcePanel && (
        <AnnotatedSection
          title={t('connectionHeading')}
          description={t('connectionDesc')}
        >
          <SourcePanel onChanged={refreshSource} />
        </AnnotatedSection>
      )}

      {skin?.showsHealth && (
        <AnnotatedSection
          title={t('health.heading')}
          description={t('health.desc')}
        >
          <SourceHealthCard />
        </AnnotatedSection>
      )}

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
