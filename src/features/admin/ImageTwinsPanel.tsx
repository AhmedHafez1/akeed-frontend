'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge, Button } from '@/shared/ui'
import { TemplateErrorNotice } from './TemplateAdminUi'
import { TemplateConfirmDialog, TemplateNotice } from './TemplateWriteUi'
import {
  imageTwinCounts,
  imageTwinOutcomeTone,
} from './admin-image-twins.model'
import { useAdminImageTwins } from './useAdminImageTwins'

/**
 * The image-header twins the logo header sends. Any staff member sees the
 * counts; a template operator creates the missing twins at Meta in one run
 * and, after Meta's review and a sync, switches on the approved ones.
 */
export function ImageTwinsPanel({ operator }: { operator: boolean }) {
  const t = useTranslations('adminTemplates.imageTwins')
  const state = useAdminImageTwins()
  const [confirming, setConfirming] = useState(false)
  const page = state.overview.data
  const counts = imageTwinCounts(page?.parents ?? [])
  const results = state.create.result?.results ?? null
  const activation = state.activate.result

  return (
    <section
      className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm"
      aria-label={t('title')}
      aria-busy={state.overview.loading}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-foreground text-base font-semibold">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('description')}
          </p>
        </div>
        {operator && page && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void state.activateApproved()}
              disabled={state.activate.pending || counts.approved === 0}
            >
              {state.activate.pending ? t('activating') : t('activate')}
            </Button>
            <Button
              onClick={() => {
                state.create.reset()
                setConfirming(true)
              }}
              disabled={!page.meta_app_configured || counts.missing === 0}
            >
              {t('create')}
            </Button>
          </div>
        )}
      </div>

      {state.overview.error && (
        <TemplateErrorNotice
          error={state.overview.error}
          onRetry={page ? undefined : state.overview.refresh}
        />
      )}

      {page && (
        <>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {(
              ['parents', 'twins', 'approved', 'active', 'missing'] as const
            ).map((key) => (
              <div key={key} className="flex gap-1.5">
                <dt className="text-muted-foreground">{t(`counts.${key}`)}</dt>
                <dd className="text-foreground font-semibold tabular-nums">
                  {counts[key]}
                </dd>
              </div>
            ))}
          </dl>
          {operator && !page.meta_app_configured && (
            <TemplateNotice tone="warning" title={t('notConfigured')} />
          )}
          <p className="text-muted-foreground text-xs">{t('reviewNote')}</p>
        </>
      )}

      {state.activate.error && (
        <TemplateErrorNotice error={state.activate.error} />
      )}
      {activation && (
        <TemplateNotice
          tone="success"
          title={t('activated', {
            activated: activation.activated.length,
            waiting: activation.waiting.length,
          })}
        />
      )}

      {results && !confirming && <ImageTwinResults results={results} />}

      <TemplateConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('confirmTitle')}
        description={t('confirmDescription', { count: counts.missing })}
        confirmLabel={state.create.pending ? t('creating') : t('create')}
        pending={state.create.pending}
        done={results !== null}
        onConfirm={() => void state.createMissing()}
      >
        {state.create.error && (
          <TemplateErrorNotice error={state.create.error} />
        )}
        {results && <ImageTwinResults results={results} />}
      </TemplateConfirmDialog>
    </section>
  )
}

function ImageTwinResults({
  results,
}: {
  results: NonNullable<
    ReturnType<typeof useAdminImageTwins>['create']['result']
  >['results']
}) {
  const t = useTranslations('adminTemplates.imageTwins')
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-start text-sm">
        <caption className="sr-only">{t('resultsCaption')}</caption>
        <thead className="text-muted-foreground text-xs">
          <tr>
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t('columns.template')}
            </th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t('columns.language')}
            </th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t('columns.outcome')}
            </th>
            <th scope="col" className="py-2 text-start font-medium">
              {t('columns.detail')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {results.map((result) => (
            <tr key={result.parent_key}>
              <td className="py-2 pe-3 font-mono text-xs" dir="ltr">
                {result.twin_template_name ?? result.parent_template_name}
              </td>
              <td className="py-2 pe-3 font-mono text-xs" dir="ltr">
                {result.language_code}
              </td>
              <td className="py-2 pe-3">
                <Badge variant={imageTwinOutcomeTone(result.outcome)}>
                  {t(`outcomes.${result.outcome}`)}
                </Badge>
              </td>
              <td className="text-muted-foreground py-2 text-xs">
                {[
                  result.reason,
                  result.provider_code !== null
                    ? `#${result.provider_code}`
                    : null,
                  result.review_status,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
