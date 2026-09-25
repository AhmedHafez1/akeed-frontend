'use client'

import type { ReactNode } from 'react'
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
import { CheckStep } from '../check/CheckStep'
import { CommittingView } from '../CommittingView'
import { DuplicateFileBanner } from '../DuplicateFileBanner'
import { ImportedView } from '../ImportedView'
import { ImportNotice } from '../ImportNotice'
import { PartialImportView } from '../PartialImportView'
import { ReleaseView } from '../ReleaseView'
import { ReviewStep } from '../ReviewStep'
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

/**
 * The views from before the modal redesign (review, import, release): they
 * bring their own footer, which is fixed to the dialog's bottom on phones.
 * Phases 4 and 6 replace them.
 */
function LegacyStep({ children }: { children: ReactNode }) {
  return (
    <ModalStepLayout bodyClassName="max-md:pb-32">{children}</ModalStepLayout>
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
  reopenStart,
  onStartClosed,
}: {
  availability: BulkImportAvailability
  detail: UseQueryResult<OrderImportBatchDetail>
  editingMapping: boolean
  onEditingMappingChange: (editing: boolean) => void
  onChangeFile: () => void
  reopenStart: boolean
  onStartClosed: () => void
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

  switch (view.kind) {
    case 'expired':
      return (
        <ModalStepLayout>
          <BatchStateNotice state="expired" />
        </ModalStepLayout>
      )
    case 'committing':
      return (
        <LegacyStep>
          <CommittingView detail={batch} />
        </LegacyStep>
      )
    case 'imported':
      return (
        <LegacyStep>
          <ImportedView
            detail={batch}
            canEdit={canEdit}
            openStartOnLoad={reopenStart}
            onStartClosed={() => {
              if (reopenStart) onStartClosed()
            }}
          />
        </LegacyStep>
      )
    case 'release':
      return (
        <LegacyStep>
          <ReleaseView detail={batch} canEdit={canEdit} />
        </LegacyStep>
      )
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
      return (
        <LegacyStep>
          <PartialImportView detail={batch} />
        </LegacyStep>
      )
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

  return (
    <LegacyStep>
      <ReviewStep
        detail={batch}
        canEdit={canEdit}
        onBackToMapping={() => onEditingMappingChange(true)}
      />
    </LegacyStep>
  )
}
