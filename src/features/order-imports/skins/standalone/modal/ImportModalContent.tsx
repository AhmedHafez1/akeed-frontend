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
import type { BulkImportAvailability } from '../../../domain/useBulkImportAvailability'
import { BatchStateNotice } from '../BatchStateNotice'
import { CommittingView } from '../CommittingView'
import { DuplicateFileBanner } from '../DuplicateFileBanner'
import { ImportedView } from '../ImportedView'
import { ImportNotice } from '../ImportNotice'
import { MapStep } from '../MapStep'
import { PartialImportView } from '../PartialImportView'
import { ReleaseView } from '../ReleaseView'
import { ReviewStep } from '../ReviewStep'
import { UploadStep } from '../UploadStep'

export function ImportContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
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
    return <BatchStateNotice state="disabled" />
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
  reopenStart,
  onStartClosed,
}: {
  availability: BulkImportAvailability
  detail: UseQueryResult<OrderImportBatchDetail>
  editingMapping: boolean
  onEditingMappingChange: (editing: boolean) => void
  reopenStart: boolean
  onStartClosed: () => void
}) {
  const t = useTranslations('orderImport')

  if (availability === 'disabled' || isRefusal(detail.error, 'IMPORT_DISABLED'))
    return <BatchStateNotice state="disabled" />
  if (availability === 'loading' || detail.isPending)
    return <ImportContentSkeleton />
  if (detail.isError)
    return isRefusal(detail.error, 'IMPORT_BATCH_NOT_FOUND') ? (
      <BatchStateNotice state="notFound" />
    ) : (
      <BatchStateNotice
        state="loadFailed"
        onRetry={() => void detail.refetch()}
      />
    )

  const batch = detail.data
  const canEdit = batch.permissions.canEdit
  const view = viewForBatch(batch)

  switch (view.kind) {
    case 'expired':
      return <BatchStateNotice state="expired" />
    case 'committing':
      return <CommittingView detail={batch} />
    case 'imported':
      return (
        <ImportedView
          detail={batch}
          canEdit={canEdit}
          openStartOnLoad={reopenStart}
          onStartClosed={() => {
            if (reopenStart) onStartClosed()
          }}
        />
      )
    case 'release':
      return <ReleaseView detail={batch} canEdit={canEdit} />
    case 'notStarted':
      return (
        <ImportNotice
          tone="neutral"
          role="status"
          title={t('release.notStartedTitle')}
        >
          {t('release.notStartedBody')}
        </ImportNotice>
      )
    case 'partial':
      return <PartialImportView detail={batch} />
    case 'unavailable':
      return (
        <BatchStateNotice
          state="unavailable"
          status={t(`batchStatus.${view.status}`)}
        />
      )
  }

  const mapping = view.step === 'map' || (editingMapping && canEdit)
  return (
    <div className="space-y-5">
      {batch.duplicateFileOf && mapping && (
        <DuplicateFileBanner duplicate={batch.duplicateFileOf} />
      )}
      {mapping ? (
        <MapStep
          // A fresh form each time the merchant comes back to it.
          key={`map-${batch.mappingConfirmed}`}
          detail={batch}
          canEdit={canEdit}
          onSaved={() => onEditingMappingChange(false)}
        />
      ) : (
        <ReviewStep
          detail={batch}
          canEdit={canEdit}
          onBackToMapping={() => onEditingMappingChange(true)}
        />
      )}
    </div>
  )
}
