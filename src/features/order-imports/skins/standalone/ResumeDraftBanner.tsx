'use client'

import { FileSpreadsheet } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button, LoadingButton, notify } from '@/shared/ui'
import { useDiscardOrderImport } from '../../api/orderImportMutations'
import type { OrderImportOpenDraft } from '../../api/orderImportsApi'

/** The draft the merchant most likely wants back: the newest one. */
export function newestDraft(
  drafts: readonly OrderImportOpenDraft[]
): OrderImportOpenDraft | undefined {
  return [...drafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

/**
 * "أكمل من حيث توقفت": the newest open draft, to continue or discard. Closing
 * the modal mid-flow leaves the uploaded file as this draft.
 */
export function ResumeDraftBanner({
  draft,
  canEdit,
  highlighted = false,
  onResume,
}: {
  draft: OrderImportOpenDraft
  canEdit: boolean
  /** An upload was refused for too many drafts: discarding this one helps. */
  highlighted?: boolean
  onResume: (batchId: string) => void
}) {
  const t = useTranslations('orderImport')
  const format = useFormatter()
  const discard = useDiscardOrderImport()

  return (
    <section
      aria-labelledby="order-import-resume"
      className={cn(
        'rounded-card flex flex-wrap items-center gap-3 border p-4',
        highlighted
          ? 'border-warning-border bg-warning-subtle'
          : 'border-primary-border bg-primary-subtle/40'
      )}
    >
      <span className="border-border bg-card text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-lg border">
        <FileSpreadsheet aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3
          id="order-import-resume"
          className="text-foreground text-sm font-semibold"
        >
          {t('resume.title')}
        </h3>
        <p className="text-muted-foreground truncate text-xs leading-5">
          <bdi>{draft.fileName}</bdi>
          {' · '}
          {t('drafts.meta', {
            rows: draft.rowCount,
            time: format.relativeTime(new Date(draft.createdAt), new Date()),
          })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {canEdit && (
          <LoadingButton
            type="button"
            variant="ghost"
            size="sm"
            loading={discard.isPending}
            aria-label={t('resume.dismissLabel', { name: draft.fileName })}
            onClick={() =>
              discard.mutate(draft.batchId, {
                onSuccess: () => notify.success({ message: t('discard.done') }),
                onError: () => notify.error({ message: t('discard.failed') }),
              })
            }
          >
            {t('resume.dismiss')}
          </LoadingButton>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-card"
          aria-label={t('resume.continueLabel', { name: draft.fileName })}
          onClick={() => onResume(draft.batchId)}
        >
          {canEdit ? t('resume.continue') : t('drafts.view')}
        </Button>
      </div>
    </section>
  )
}
