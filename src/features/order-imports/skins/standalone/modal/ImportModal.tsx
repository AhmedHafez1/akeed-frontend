'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui'
import {
  openDraftsOptions,
  orderImportDetailOptions,
} from '../../../api/orderImportQueries'
import type { ImportModalTarget } from '../../../domain/importRoutes'
import { modalStepFor, viewForBatch } from '../../../domain/importStep'
import { useBulkImportAvailability } from '../../../domain/useBulkImportAvailability'
import { useImportModalUrl } from '../../../domain/useImportModalUrl'
import { ImportNotice } from '../ImportNotice'
import { useStepHeadingFocus } from '../importHeading'
import { ImportBatchContent, ImportNewContent } from './ImportModalContent'
import { ImportStepBar, ImportStepMeter, ImportStepper } from './ImportStepper'

/**
 * Mounted on Verifications: opens the import modal whenever the URL asks for
 * it (`?import=new|<batchId>`). Closing it only closes it -- an uploaded file
 * is already a draft on the server, offered again on the next open.
 */
export function ImportModalHost() {
  const url = useImportModalUrl()
  if (url.target === null) return null
  return (
    <ImportModal
      target={url.target}
      reopenStart={url.reopenStart}
      onOpen={url.open}
      onClose={url.close}
      onStartClosed={url.clearStart}
    />
  )
}

function ImportModal({
  target,
  reopenStart,
  onOpen,
  onClose,
  onStartClosed,
}: {
  target: ImportModalTarget
  reopenStart: boolean
  onOpen: (target: ImportModalTarget) => void
  onClose: () => void
  onStartClosed: () => void
}) {
  const t = useTranslations('orderImport')
  const availability = useBulkImportAvailability()
  const enabled = availability === 'enabled'
  const batchId = target.kind === 'batch' ? target.batchId : ''
  const drafts = useQuery({
    ...openDraftsOptions(),
    enabled: enabled && target.kind === 'new',
  })
  const detail = useQuery({
    ...orderImportDetailOptions(batchId),
    enabled: enabled && target.kind === 'batch',
  })
  // "Back to mapping" is the one move the server's status does not make;
  // it belongs to the batch it was made on.
  const [editingFor, setEditingFor] = useState<string | null>(null)
  const editingMapping = editingFor !== null && editingFor === batchId

  const step =
    target.kind === 'new'
      ? modalStepFor({ kind: 'new' })
      : detail.data
        ? modalStepFor(viewForBatch(detail.data), editingMapping)
        : null
  useStepHeadingFocus(step)

  const canEdit =
    target.kind === 'new'
      ? (drafts.data?.permissions.canEdit ?? true)
      : (detail.data?.permissions.canEdit ?? true)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="wide" hideClose>
        <header className="border-border shrink-0 border-b">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-foreground text-base leading-7 font-bold tracking-normal sm:text-lg">
                {t('modal.title')}
              </DialogTitle>
              <ImportStepMeter step={step} />
            </div>
            <ImportStepper step={step} />
            <DialogClose
              aria-label={t('modal.close')}
              className="hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none sm:size-10"
            >
              <X aria-hidden="true" className="size-5" />
            </DialogClose>
          </div>
          <ImportStepBar step={step} />
          <DialogDescription className="sr-only">
            {t('modal.description')}
          </DialogDescription>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {!canEdit && (
            <div className="shrink-0 px-4 pt-4 sm:px-6">
              <ImportNotice tone="info" role="status">
                {t('viewer')}
              </ImportNotice>
            </div>
          )}
          {target.kind === 'new' ? (
            <ImportNewContent
              availability={availability}
              drafts={drafts}
              onUploaded={(id) => onOpen({ kind: 'batch', batchId: id })}
              onResume={(id) => onOpen({ kind: 'batch', batchId: id })}
            />
          ) : (
            <ImportBatchContent
              availability={availability}
              detail={detail}
              editingMapping={editingMapping}
              onEditingMappingChange={(editing) =>
                setEditingFor(editing ? batchId : null)
              }
              onChangeFile={() => onOpen({ kind: 'new' })}
              reopenStart={reopenStart}
              onStartClosed={onStartClosed}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
