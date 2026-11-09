'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Badge, Button } from '@/shared/ui'
import { getMessageLanguageDirection } from '@/shared/lib/messageLanguage'
import { TemplateErrorNotice, useTemplateFormat } from './TemplateAdminUi'
import { useResource, useTemplateAction } from './useAdminTemplateDrafts'
import {
  changePreparationMarkdown,
  getChangePreparation,
  prepareChangeDrafts,
} from './adminChangePreparationApi'

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function ChangePreparationPanel({
  operator,
  onPrepared,
}: {
  operator: boolean
  onPrepared: () => void
}) {
  const t = useTranslations('adminTemplates.preparation')
  const format = useTemplateFormat()
  const { locale } = useLocaleInfo()
  const state = useResource(
    'Change preparation request failed',
    'change-preparation',
    getChangePreparation
  )
  const action = useTemplateAction<
    Awaited<ReturnType<typeof prepareChangeDrafts>>
  >('Change preparation failed')
  const page = state.data
  return (
    <section
      className="border-border bg-card rounded-card space-y-4 border p-5"
      aria-busy={state.loading}
    >
      <h2 className="text-foreground text-base font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground text-sm">{t('description')}</p>
      <div className="flex flex-wrap gap-3">
        {operator && (
          <Button
            disabled={action.pending || !page}
            onClick={() =>
              void action.run(prepareChangeDrafts).then((result) => {
                if (result) {
                  state.refresh()
                  onPrepared()
                }
              })
            }
          >
            {t(action.pending ? 'preparing' : 'prepare')}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={!page}
          onClick={() =>
            page &&
            download(
              'change-request-review.md',
              changePreparationMarkdown(page),
              'text/markdown;charset=utf-8'
            )
          }
        >
          {t('export')}
        </Button>
        <Button
          variant="outline"
          disabled={!page}
          onClick={() =>
            page &&
            download(
              'change-request-review.json',
              JSON.stringify(page, null, 2),
              'application/json'
            )
          }
        >
          {t('exportJson')}
        </Button>
      </div>
      {state.loading && <p role="status">{t('loading')}</p>}
      {state.error && (
        <TemplateErrorNotice error={state.error} onRetry={state.refresh} />
      )}
      {action.error && <TemplateErrorNotice error={action.error} />}
      {action.result && (
        <ul role="status" className="text-sm">
          {action.result.results.map((result) => (
            <li key={result.parent_key}>
              <span dir="ltr">{result.parent_key}</span>:{' '}
              {t.has(result.outcome) ? t(result.outcome) : result.outcome}
              {result.reason ? ` (${result.reason})` : ''}
            </li>
          ))}
        </ul>
      )}
      {page && (
        <>
          <p className="text-sm">
            {t('count', { count: page.variants.length })}
          </p>
          {page.variants.map((variant) => (
            <details
              key={variant.parent_key}
              className="border-border border-t pt-4"
            >
              <summary className="focus-visible:ring-ring rounded-control cursor-pointer text-sm focus-visible:ring-2">
                <span>
                  {variant.language} · {variant.style} · {variant.purpose}
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                <p
                  className="text-muted-foreground font-mono text-xs break-all"
                  dir="ltr"
                >
                  {variant.parent_key} → {variant.key ?? '—'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {format.label('draftState', variant.state)}
                  </Badge>
                  {variant.review_status && (
                    <Badge variant="outline">
                      {format.label('status', variant.review_status)}
                    </Badge>
                  )}
                  <Badge variant={variant.active ? 'success' : 'secondary'}>
                    {t(variant.active ? 'active' : 'inactive')}
                  </Badge>
                  <Badge variant="outline">
                    {t('logo')}:{' '}
                    {variant.image_twin.review_status ??
                      t(
                        variant.image_twin.state === 'planned'
                          ? 'planned'
                          : 'registered'
                      )}
                  </Badge>
                </div>
                {(variant.blocked_reason ||
                  variant.validation?.valid === false) && (
                  <p role="status" className="text-destructive">
                    {t('blocked')}: {variant.blocked_reason ?? t('invalid')}
                  </p>
                )}
                {variant.differences.length > 0 && (
                  <p className="bg-warning-subtle text-warning-subtle-foreground rounded-control p-3">
                    {t('labelDifference')}
                  </p>
                )}
                {variant.content && (
                  <>
                    <p className="font-mono text-xs break-all" dir="ltr">
                      {variant.content.templateName} [
                      {variant.content.languageCode}] ·{' '}
                      {variant.content.category} ·{' '}
                      {variant.content.parameterFormat}
                    </p>
                    <p
                      className="whitespace-pre-wrap"
                      dir={getMessageLanguageDirection(variant.language)}
                    >
                      {variant.content.body}
                    </p>
                    <ol
                      className="list-decimal space-y-1 ps-5"
                      dir={getMessageLanguageDirection(variant.language)}
                    >
                      {[
                        variant.content.confirmLabel,
                        variant.content.cancelLabel,
                        variant.content.changeLabel,
                      ].map((label, index) => (
                        <li key={index}>{label}</li>
                      ))}
                    </ol>
                    <dl dir="ltr" className="text-xs">
                      {Object.entries(variant.content.samples).map(
                        ([key, sample]) => (
                          <div key={key} className="flex flex-wrap gap-2">
                            <dt>{key}</dt>
                            <dd>{sample}</dd>
                          </div>
                        )
                      )}
                    </dl>
                  </>
                )}
                <p
                  className="text-muted-foreground font-mono text-xs break-all"
                  dir="ltr"
                >
                  {variant.image_twin.key} · {variant.image_twin.template_name}{' '}
                  · IMAGE
                </p>
                {variant.draft_id && (
                  <Button asChild variant="outline">
                    <Link
                      href={`/${locale}/admin/templates/drafts/${variant.draft_id}`}
                    >
                      {t('review')}
                    </Link>
                  </Button>
                )}
              </div>
            </details>
          ))}
          {page.draft_only_sources.map((source) => (
            <p
              key={source.parent_key}
              className="text-muted-foreground text-sm"
              dir="ltr"
            >
              {source.parent_key}: {source.reason}
            </p>
          ))}
          {page.variants.length === 0 && <p>{t('empty')}</p>}
        </>
      )}
      <p className="text-muted-foreground text-sm">{t('ownNumber')}</p>
      <p className="text-muted-foreground text-xs">{t('submissionBoundary')}</p>
    </section>
  )
}
