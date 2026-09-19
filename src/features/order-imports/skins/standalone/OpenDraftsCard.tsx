'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileSpreadsheet } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { Button, notify } from '@/shared/ui'
import { useDiscardOrderImport } from '../../api/orderImportMutations'
import type { OrderImportOpenDraft } from '../../api/orderImportsApi'
import { DiscardImportDialog } from './DiscardImportDialog'

interface OpenDraftsCardProps {
  drafts: readonly OrderImportOpenDraft[]
  canEdit: boolean
  /** Shown above the list when an upload was refused for too many drafts. */
  highlighted?: boolean
}

/** Drafts the merchant can resume or discard (story AC1). */
export function OpenDraftsCard({
  drafts,
  canEdit,
  highlighted = false,
}: OpenDraftsCardProps) {
  const t = useTranslations('orderImport')
  const format = useFormatter()
  const locale = useLocale()
  const discard = useDiscardOrderImport()
  const [pendingDiscard, setPendingDiscard] = useState<string | null>(null)

  if (drafts.length === 0) return null

  const confirmDiscard = () => {
    if (!pendingDiscard) return
    discard.mutate(pendingDiscard, {
      onSuccess: () => {
        setPendingDiscard(null)
        notify.success({ message: t('discard.done') })
      },
      onError: () => notify.error({ message: t('discard.failed') }),
    })
  }

  return (
    <section
      aria-labelledby="order-import-drafts"
      className={
        highlighted
          ? 'rounded-card border-warning-border bg-card border-2 p-5'
          : 'rounded-card border-border bg-card border p-5'
      }
    >
      <h3
        id="order-import-drafts"
        className="text-foreground text-sm font-semibold"
      >
        {t('drafts.title')}
      </h3>
      <ul className="divide-border mt-3 divide-y">
        {drafts.map((draft) => (
          <li
            key={draft.batchId}
            className="flex flex-wrap items-center gap-3 py-3"
          >
            <FileSpreadsheet
              aria-hidden="true"
              className="text-muted-foreground size-5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                <bdi>{draft.fileName}</bdi>
              </p>
              <p className="text-muted-foreground text-xs">
                {t('drafts.meta', {
                  rows: draft.rowCount,
                  time: format.relativeTime(
                    new Date(draft.createdAt),
                    new Date()
                  ),
                })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="link" size="sm">
                <Link
                  href={withLocale(`/imports/${draft.batchId}`, locale)}
                  aria-label={t('drafts.resumeLabel', {
                    name: draft.fileName,
                  })}
                >
                  {canEdit ? t('drafts.resume') : t('drafts.view')}
                </Link>
              </Button>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  aria-label={t('drafts.discardLabel', {
                    name: draft.fileName,
                  })}
                  onClick={() => setPendingDiscard(draft.batchId)}
                >
                  {t('drafts.discard')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <DiscardImportDialog
        open={pendingDiscard !== null}
        pending={discard.isPending}
        onOpenChange={(open) => !open && setPendingDiscard(null)}
        onConfirm={confirmDiscard}
      />
    </section>
  )
}
