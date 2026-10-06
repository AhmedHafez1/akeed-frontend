'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Badge, Button } from '@/shared/ui'
import { TemplateErrorNotice, useTemplateFormat } from './TemplateAdminUi'
import { TemplateEnvironment, TemplateWriteAccess } from './TemplateWriteUi'
import { draftStateTone } from './admin-template-drafts.model'
import { useTemplateDrafts } from './useAdminTemplateDrafts'

/**
 * The drafts staff are writing, on the templates list (US-08-06). Any staff
 * member can read them; only a template operator is offered "New draft".
 */
export function TemplateDraftsPanel() {
  const t = useTranslations('adminTemplates.drafts')
  const format = useTemplateFormat()
  const { locale } = useLocaleInfo()
  const state = useTemplateDrafts()
  const page = state.data
  const operator = !!page?.operations.enabled && !!page.operations.operator
  const base = `/${locale}/admin/templates/drafts`

  return (
    <section
      className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm"
      aria-label={t('title')}
      aria-busy={state.loading}
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
        {operator && (
          <Button asChild>
            <Link href={`${base}/new`}>{t('new')}</Link>
          </Button>
        )}
      </div>
      {state.error && (
        <TemplateErrorNotice
          error={state.error}
          onRetry={page ? undefined : state.refresh}
        />
      )}
      {page && (
        <>
          <TemplateEnvironment environment={page.environment} />
          <TemplateWriteAccess operations={page.operations} />
          {page.drafts.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-start text-sm">
                <caption className="sr-only">{t('title')}</caption>
                <thead className="bg-muted/50 text-foreground/70 text-xs">
                  <tr>
                    {(['name', 'language', 'state', 'updated'] as const).map(
                      (column) => (
                        <th
                          key={column}
                          scope="col"
                          className="p-3 text-start font-medium whitespace-nowrap"
                        >
                          {t(`columns.${column}`)}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {page.drafts.map((draft) => (
                    <tr
                      key={draft.id}
                      className="border-border border-t align-top"
                    >
                      <th scope="row" className="p-3 text-start font-normal">
                        <Link
                          href={`${base}/${draft.id}`}
                          className="text-primary focus-visible:ring-ring rounded font-mono text-sm font-medium break-all hover:underline focus-visible:ring-2 focus-visible:outline-none"
                          dir="ltr"
                        >
                          {draft.template_name}
                        </Link>
                        {!draft.validation.valid && draft.state === 'draft' && (
                          <p className="text-destructive mt-1 text-xs">
                            {t('invalid')}
                          </p>
                        )}
                      </th>
                      <td className="p-3">
                        <span>{format.label('language', draft.language)}</span>
                        <span
                          className="text-muted-foreground ms-1.5 font-mono text-xs"
                          dir="ltr"
                        >
                          [{draft.language_code}]
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={draftStateTone(draft.state)}>
                          {format.label('draftState', draft.state)}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {format.dateTime(draft.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
