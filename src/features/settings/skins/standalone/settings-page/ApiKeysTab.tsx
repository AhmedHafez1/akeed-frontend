'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, KeyRound, Plus } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  integrationKeysOptions,
  useRevokeIntegrationKeyMutation,
  type IntegrationApiKey,
} from '@/features/settings/api/integrationKeysApi'
import { integrationKeyErrorKey } from '@/features/settings/domain/integrationKeyErrors'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { cn } from '@/shared/lib/utils'
import { akButton, akPill, Skeleton } from '@/shared/ui'
import { CreateApiKeyDialog } from './CreateApiKeyDialog'
import { RevokeApiKeyDialog } from './RevokeApiKeyDialog'
import {
  AnnotatedSection,
  AnnotatedSections,
  settingsRowPadding,
  settingsRowTitle,
} from './SettingsSection'

interface ApiKeysTabProps {
  /** Viewers see the keys but cannot create or revoke them. */
  readOnly: boolean
}

/**
 * Server credentials for the store's own back end: what they are for, the
 * keys issued so far, and creating or revoking one.
 */
export function ApiKeysTab({ readOnly }: ApiKeysTabProps) {
  const t = useTranslations('settings.standalone.page.apiKeys')
  const format = useFormatter()
  const { isStandalone, isLoading: isModeLoading } = useAkeedMode()
  const keys = useQuery(integrationKeysOptions(isStandalone && !isModeLoading))
  const revoke = useRevokeIntegrationKeyMutation()
  const [isCreating, setIsCreating] = useState(false)
  const [revoking, setRevoking] = useState<IntegrationApiKey | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const list = keys.data?.keys ?? []
  const maxActive = keys.data?.maxActive ?? 0
  const activeCount = list.filter((key) => key.status === 'active').length
  const atLimit = keys.isSuccess && activeCount >= maxActive

  const dismissRevoke = () => {
    setRevoking(null)
    setRevokeError(null)
  }

  const confirmRevoke = async () => {
    if (!revoking) return
    setRevokeError(null)
    try {
      await revoke.mutateAsync(revoking.id)
      setRevoking(null)
    } catch (error) {
      setRevokeError(t(`errors.${integrationKeyErrorKey(error)}`))
    }
  }

  const formatDate = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: 'medium' })

  return (
    <>
      <AnnotatedSections>
        <AnnotatedSection title={t('heading')} description={t('description')}>
          <div
            className={cn(
              'flex flex-wrap items-start justify-between gap-4',
              settingsRowPadding
            )}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="bg-neutral-soft text-ink-muted rounded-ak-control grid size-10 shrink-0 place-items-center">
                <KeyRound aria-hidden="true" className="size-4.5" />
              </span>
              <div className="min-w-0">
                <h3 className={settingsRowTitle}>{t('serverOnlyTitle')}</h3>
                <p className="text-ak-caption text-ink-muted mt-0.5">
                  {t('serverOnly')}
                </p>
              </div>
            </div>
            {!readOnly && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  disabled={!keys.isSuccess || atLimit}
                  className={akButton({ variant: 'primary', size: 'row' })}
                >
                  <Plus aria-hidden="true" />
                  {t('createButton')}
                </button>
                {atLimit && (
                  <p className="text-ak-caption text-ink-muted">
                    {t('limitReached', { max: maxActive })}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border-line border-t">
            {keys.isPending && keys.fetchStatus !== 'idle' && (
              <div className={cn('space-y-3', settingsRowPadding)}>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            )}
            {keys.isError && (
              <div
                role="alert"
                className={cn(
                  'text-ak-danger text-ak-body flex flex-wrap items-center gap-3',
                  settingsRowPadding
                )}
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="size-4.5 shrink-0"
                />
                <p className="min-w-0 flex-1">
                  {t(`errors.${integrationKeyErrorKey(keys.error)}`)}
                </p>
                <button
                  type="button"
                  onClick={() => void keys.refetch()}
                  className={akButton({ variant: 'secondary', size: 'table' })}
                >
                  {t('retry')}
                </button>
              </div>
            )}
            {keys.isSuccess && list.length === 0 && (
              <p
                className={cn(
                  'text-ak-body text-ink-muted',
                  settingsRowPadding
                )}
              >
                {t('empty')}
              </p>
            )}
            {keys.isSuccess && list.length > 0 && (
              <ul aria-label={t('listLabel')}>
                {list.map((key) => (
                  <li
                    key={key.id}
                    className={cn(
                      'border-line flex flex-wrap items-center justify-between gap-3 not-first:border-t',
                      settingsRowPadding
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-ink text-ak-body font-semibold break-all">
                          {key.name}
                        </span>
                        <span
                          className={akPill({
                            tone: key.status === 'active' ? 'brand' : 'neutral',
                          })}
                        >
                          {t(`status.${key.status}`)}
                        </span>
                      </div>
                      <div className="text-ak-caption text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                        <code
                          dir="ltr"
                          className="bg-neutral-soft text-ink rounded-md px-1.5 py-px font-mono"
                        >
                          {`${key.prefix}_…`}
                        </code>
                        <span>
                          {t('createdAt', { date: formatDate(key.createdAt) })}
                        </span>
                        {key.revokedAt && (
                          <span>
                            {t('revokedAt', {
                              date: formatDate(key.revokedAt),
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    {!readOnly && key.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => setRevoking(key)}
                        aria-label={t('revokeLabel', { name: key.name })}
                        className={cn(
                          akButton({ variant: 'ghost', size: 'table' }),
                          'text-ak-danger hover:text-ak-danger'
                        )}
                      >
                        {t('revokeButton')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AnnotatedSection>
      </AnnotatedSections>

      {!readOnly && (
        <CreateApiKeyDialog
          open={isCreating}
          onClose={() => setIsCreating(false)}
        />
      )}
      <RevokeApiKeyDialog
        keyName={revoking?.name ?? null}
        isRevoking={revoke.isPending}
        error={revokeError}
        onConfirm={() => void confirmRevoke()}
        onDismiss={dismissRevoke}
      />
    </>
  )
}
