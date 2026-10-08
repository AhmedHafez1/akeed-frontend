'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button } from '@/shared/ui'
import { AdminSelect } from './AdminUi'
import { TemplateErrorNotice, useTemplateFormat } from './TemplateAdminUi'
import { TemplateConfirmDialog, TemplateNotice } from './TemplateWriteUi'
import { runTemplateAction } from './adminTemplateDraftsApi'
import type {
  TemplateImpact,
  TemplateLifecycleAction,
  TemplateLifecycleResult,
} from './admin-template-drafts.model'
import { useTemplateAction, useTemplateImpact } from './useAdminTemplateDrafts'

/** The actions a template's state allows; the backend decides for real. */
function availableActions(impact: TemplateImpact): TemplateLifecycleAction[] {
  if (impact.retired) return []
  const approved = impact.review_status === 'approved'
  return [
    ...(!impact.is_active && approved ? (['activate'] as const) : []),
    ...(impact.is_active && !impact.is_default && approved
      ? (['set-default'] as const)
      : []),
    ...(impact.is_active ? (['deactivate'] as const) : []),
    'retire',
  ]
}

const WITHDRAWALS: readonly TemplateLifecycleAction[] = ['deactivate', 'retire']

/** The message group of each action. */
const MESSAGES = {
  activate: 'activate',
  deactivate: 'deactivate',
  'set-default': 'setDefault',
  retire: 'retire',
} as const satisfies Record<TemplateLifecycleAction, string>

function ActionDialog({
  action,
  impact,
  language,
  onClose,
  onChanged,
}: {
  action: TemplateLifecycleAction
  impact: TemplateImpact
  language: string
  onClose: () => void
  onChanged: () => void
}) {
  const t = useTranslations('adminTemplates.actions')
  const write = useTemplateAction<TemplateLifecycleResult>(
    'Template action failed'
  )
  const [replacement, setReplacement] = useState('')
  const withdraws = WITHDRAWALS.includes(action)
  const needsReplacement = withdraws && impact.requires_replacement
  const result = write.result

  return (
    <TemplateConfirmDialog
      open
      onOpenChange={(open) => {
        if (open) return
        if (result) onChanged()
        onClose()
      }}
      title={t(`${MESSAGES[action]}.title`)}
      description={t(`${MESSAGES[action]}.description`)}
      confirmLabel={t(`${MESSAGES[action]}.confirm`)}
      destructive={action === 'retire'}
      pending={write.pending}
      confirmDisabled={needsReplacement && replacement === ''}
      done={result !== null}
      onConfirm={() =>
        void write.run(() =>
          runTemplateAction(
            impact.key,
            action,
            needsReplacement ? replacement : undefined
          )
        )
      }
    >
      <p className="font-mono text-xs break-all" dir="ltr">
        {impact.key}
      </p>
      {action === 'set-default' && (
        <p>{t('setDefault.effect', { language })}</p>
      )}
      {action === 'activate' && <p>{t('activate.effect')}</p>}
      {withdraws && !result && (
        <>
          <p>
            {t('storesAffected', {
              total: impact.stores.total,
              active: impact.stores.active,
            })}
          </p>
          {impact.is_default && (
            <p className="font-medium">{t('defaultMoves', { language })}</p>
          )}
          {action === 'retire' && (
            <TemplateNotice tone="warning" title={t('retire.permanent')} />
          )}
          {needsReplacement &&
            (impact.replacements.length === 0 ? (
              <TemplateNotice tone="danger" title={t('noReplacement')} />
            ) : (
              <>
                <AdminSelect
                  label={t('replacement')}
                  value={replacement}
                  onChange={(event) => setReplacement(event.target.value)}
                  options={[
                    { value: '', label: t('chooseReplacement') },
                    ...impact.replacements.map((entry) => ({
                      value: entry.key,
                      label: `${entry.key} (${entry.template_name})`,
                    })),
                  ]}
                />
                {replacement !== '' && (
                  <p role="status" className="font-medium">
                    {t('storesMove', {
                      count: impact.stores.total,
                      replacement,
                    })}
                  </p>
                )}
              </>
            ))}
        </>
      )}
      {write.error && <TemplateErrorNotice error={write.error} />}
      {result && (
        <TemplateNotice
          tone="success"
          title={
            result.changed ? t(`${MESSAGES[action]}.done`) : t('unchanged')
          }
        >
          {result.replacement_key && (
            <p className="mt-1">
              {t('storesMoved', {
                count: result.moved_stores,
                replacement: result.replacement_key,
              })}
            </p>
          )}
        </TemplateNotice>
      )}
      <p className="text-muted-foreground text-xs">{t('audited')}</p>
    </TemplateConfirmDialog>
  )
}

/**
 * The staff actions on one registry template (US-08-06 criteria 5 to 7).
 * Each opens a confirmation that states its effect, with the stores it moves.
 * Operators see the controls; everyone else sees only the template's state,
 * and the backend refuses the writes whatever the page shows.
 */
export function TemplateActionsPanel({
  templateKey,
  language,
  operator,
  onChanged,
}: {
  templateKey: string
  language: string
  operator: boolean
  onChanged: () => void
}) {
  const t = useTranslations('adminTemplates.actions')
  const format = useTemplateFormat()
  const { locale } = useLocaleInfo()
  const state = useTemplateImpact(templateKey)
  const [open, setOpen] = useState<TemplateLifecycleAction | null>(null)
  const impact = state.data
  const languageLabel = format.label('language', language)

  if (state.error) {
    return <TemplateErrorNotice error={state.error} onRetry={state.refresh} />
  }
  if (!impact) return null

  const rejected =
    impact.review_status === 'rejected' &&
    impact.rejection_reason !== null &&
    impact.rejection_reason !== 'none'
  const actions = operator ? availableActions(impact) : []

  return (
    <section
      className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm"
      aria-label={t('title')}
    >
      <div>
        <h2 className="text-foreground text-base font-semibold">
          {t('title')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      </div>
      {impact.retired && <TemplateNotice tone="info" title={t('retired')} />}
      {rejected && (
        <TemplateNotice tone="danger" title={t('rejectedTitle')}>
          <p className="mt-1">
            {format.label('rejection', impact.rejection_reason ?? 'unknown')}
          </p>
        </TemplateNotice>
      )}
      <p className="text-sm">
        {t('storesAffected', {
          total: impact.stores.total,
          active: impact.stores.active,
        })}
      </p>
      {operator && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === 'retire' ? 'destructive' : 'outline'}
              onClick={() => setOpen(action)}
            >
              {t(`${MESSAGES[action]}.button`)}
            </Button>
          ))}
          {impact.edit.draft_id && (
            <Button variant="outline" asChild>
              <Link
                href={`/${locale}/admin/templates/drafts/${impact.edit.draft_id}`}
              >
                {t('openText')}
              </Link>
            </Button>
          )}
        </div>
      )}
      {open && (
        <ActionDialog
          key={open}
          action={open}
          impact={impact}
          language={languageLabel}
          onClose={() => setOpen(null)}
          onChanged={() => {
            state.refresh()
            onChanged()
          }}
        />
      )}
    </section>
  )
}
