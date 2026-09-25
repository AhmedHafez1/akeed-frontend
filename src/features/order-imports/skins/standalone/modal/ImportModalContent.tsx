'use client'

import type { UseQueryResult } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/shared/ui'
import {
  isOrderImportApiError,
  type OrderImportBatchDetail,
  type OrderImportDraftList,
} from '../../../api/orderImportsApi'
import { viewForBatch } from '../../../domain/importStep'
import type { SendOutcome } from '../../../domain/useSendStep'
import type { BulkImportAvailability } from '../../../domain/useBulkImportAvailability'
import { BatchStateNotice } from '../BatchStateNotice'
import { CheckStep } from '../check/CheckStep'
import { DuplicateFileBanner } from '../DuplicateFileBanner'
import { ImportNotice } from '../ImportNotice'
import { PartialImportView } from '../send/PartialImportView'
import { SendProgressView } from '../send/SendProgressView'
import { SendStep } from '../send/SendStep'
import { UploadStep } from '../UploadStep'
import { ModalStepLayout } from './ModalStepLayout'

export function ImportContentSkeleton() {
  return (
    <ModalStepLayout>
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </ModalStepLayout>
  )
}

function isRefusal(error: unknown, code: string): boolean {
  return isOrderImportApiError(error) && error.code === code
}

/** Step 1: choose a file, or resume the newest draft. */
export function ImportNewContent({
  availability,
  drafts,
  onUploaded,
  onResume,
}: {
  availability: BulkImportAvailability
  drafts: UseQueryResult<OrderImportDraftList>
  onUploaded: (batchId: string) => void
  onResume: (batchId: string) => void
}) {
  if (availability === 'disabled' || isRefusal(drafts.error, 'IMPORT_DISABLED'))
    return (
      <ModalStepLayout>
        <BatchStateNotice state="disabled" />
      </ModalStepLayout>
    )
  if (availability === 'loading' || drafts.isPending)
    return <ImportContentSkeleton />

  // If the list cannot be read, uploading still works; the server decides.
  const canEdit = drafts.data?.permissions.canEdit ?? true
  return (
    <UploadStep
      canEdit={canEdit}
      drafts={drafts.data?.drafts ?? []}
      onUploaded={onUploaded}
      onResume={onResume}
    />
  )
}

/** Steps 2 and 3 for one batch, as the server's status places it. */
export function ImportBatchContent({
  availability,
  detail,
  editingMapping,
  onEditingMappingChange,
  onChangeFile,
  onDone,
}: {
  availability: BulkImportAvailability
  detail: UseQueryResult<OrderImportBatchDetail>
  editingMapping: boolean
  onEditingMappingChange: (editing: boolean) => void
  onChangeFile: () => void
  onDone: (outcome: SendOutcome) => void
}) {
  const t = useTranslations('orderImport')

  if (availability === 'disabled' || isRefusal(detail.error, 'IMPORT_DISABLED'))
    return (
      <ModalStepLayout>
        <BatchStateNotice state="disabled" />
      </ModalStepLayout>
    )
  if (availability === 'loading' || detail.isPending)
    return <ImportContentSkeleton />
  if (detail.isError)
    return (
      <ModalStepLayout>
        {isRefusal(detail.error, 'IMPORT_BATCH_NOT_FOUND') ? (
          <BatchStateNotice state="notFound" />
        ) : (
          <BatchStateNotice
            state="loadFailed"
            onRetry={() => void detail.refetch()}
          />
        )}
      </ModalStepLayout>
    )

  const batch = detail.data
  const canEdit = batch.permissions.canEdit
  const view = viewForBatch(batch)
  // One element across review, import and start: its state survives them.
  const sendStep = (
    <SendStep
      key={batch.batchId}
      detail={batch}
      canEdit={canEdit}
      onBack={() => onEditingMappingChange(true)}
      onDone={onDone}
    />
  )

  switch (view.kind) {
    case 'expired':
      return (
        <ModalStepLayout>
          <BatchStateNotice state="expired" />
        </ModalStepLayout>
      )
    case 'committing':
    case 'imported':
      return sendStep
    case 'release':
      return <SendProgressView detail={batch} canEdit={canEdit} />
    case 'notStarted':
      return (
        <ModalStepLayout>
          <ImportNotice
            tone="neutral"
            role="status"
            title={t('release.notStartedTitle')}
          >
            {t('release.notStartedBody')}
          </ImportNotice>
        </ModalStepLayout>
      )
    case 'partial':
      return <PartialImportView detail={batch} />
    case 'unavailable':
      return (
        <ModalStepLayout>
          <BatchStateNotice
            state="unavailable"
            status={t(`batchStatus.${view.status}`)}
          />
        </ModalStepLayout>
      )
  }

  if (view.step === 'map' || (editingMapping && canEdit))
    return (
      <CheckStep
        // A fresh form each time the merchant comes back to it.
        key={`check-${batch.mappingConfirmed}`}
        detail={batch}
        canEdit={canEdit}
        onSaved={() => onEditingMappingChange(false)}
        onChangeFile={onChangeFile}
        notice={
          batch.duplicateFileOf && (
            <DuplicateFileBanner duplicate={batch.duplicateFileOf} />
          )
        }
      />
    )

  return sendStep
}
