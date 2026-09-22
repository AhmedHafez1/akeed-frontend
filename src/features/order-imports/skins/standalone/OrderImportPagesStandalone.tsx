'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/shared/ui'
import {
  openDraftsOptions,
  orderImportDetailOptions,
} from '../../api/orderImportQueries'
import { isOrderImportApiError } from '../../api/orderImportsApi'
import { viewForBatch } from '../../domain/importStep'
import { useBulkImportAvailability } from '../../domain/useBulkImportAvailability'
import { BatchStateNotice } from './BatchStateNotice'
import { CommittingView } from './CommittingView'
import { ImportedView } from './ImportedView'
import { ImportNotice } from './ImportNotice'
import { PartialImportView } from './PartialImportView'
import { ReleaseView } from './ReleaseView'
import { DuplicateFileBanner } from './DuplicateFileBanner'
import { ImportWizardShell } from './ImportWizardShell'
import { MapStep } from './MapStep'
import { ReviewStep } from './ReviewStep'
import { UploadStep } from './UploadStep'

function WizardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function isRefusal(error: unknown, code: string): boolean {
  return isOrderImportApiError(error) && error.code === code
}

/** `/imports/new`: step 1, with the open drafts to resume. */
export function OrderImportNewStandalone() {
  const availability = useBulkImportAvailability()
  const drafts = useQuery({
    ...openDraftsOptions(),
    enabled: availability === 'enabled',
  })

  if (availability === 'disabled' || isRefusal(drafts.error, 'IMPORT_DISABLED'))
    return (
      <ImportWizardShell step={null} canEdit>
        <BatchStateNotice state="disabled" />
      </ImportWizardShell>
    )

  if (availability === 'loading' || drafts.isPending)
    return (
      <ImportWizardShell step="upload" canEdit>
        <WizardSkeleton />
      </ImportWizardShell>
    )

  // If the list cannot be read, uploading still works; the server decides.
  const canEdit = drafts.data?.permissions.canEdit ?? true
  return (
    <ImportWizardShell step="upload" canEdit={canEdit}>
      <UploadStep canEdit={canEdit} drafts={drafts.data?.drafts ?? []} />
    </ImportWizardShell>
  )
}

/** `/imports/[batchId]`: the step the server's status says the batch is in. */
export function OrderImportBatchStandalone({ batchId }: { batchId: string }) {
  const t = useTranslations('orderImport')
  const availability = useBulkImportAvailability()
  const detail = useQuery({
    ...orderImportDetailOptions(batchId),
    enabled: availability === 'enabled',
  })
  // "Back to mapping" is the one move the server's status does not make.
  const [editingMapping, setEditingMapping] = useState(false)
  // `?start=1` is where Buy credits returns to: reopen the start dialog.
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const reopenStart = searchParams.get('start') === '1'

  if (availability === 'disabled' || isRefusal(detail.error, 'IMPORT_DISABLED'))
    return (
      <ImportWizardShell step={null} canEdit>
        <BatchStateNotice state="disabled" />
      </ImportWizardShell>
    )

  if (availability === 'loading' || detail.isPending)
    return (
      <ImportWizardShell step={null} canEdit>
        <WizardSkeleton />
      </ImportWizardShell>
    )

  if (detail.isError)
    return (
      <ImportWizardShell step={null} canEdit>
        {isRefusal(detail.error, 'IMPORT_BATCH_NOT_FOUND') ? (
          <BatchStateNotice state="notFound" />
        ) : (
          <BatchStateNotice
            state="loadFailed"
            onRetry={() => void detail.refetch()}
          />
        )}
      </ImportWizardShell>
    )

  const batch = detail.data
  const canEdit = batch.permissions.canEdit
  const view = viewForBatch(batch)

  if (view.kind === 'expired')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <BatchStateNotice state="expired" />
      </ImportWizardShell>
    )
  if (view.kind === 'committing')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <CommittingView detail={batch} />
      </ImportWizardShell>
    )
  if (view.kind === 'imported')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <ImportedView
          detail={batch}
          canEdit={canEdit}
          openStartOnLoad={reopenStart}
          onStartClosed={() => {
            if (reopenStart) router.replace(pathname)
          }}
        />
      </ImportWizardShell>
    )
  if (view.kind === 'release')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <ReleaseView detail={batch} canEdit={canEdit} />
      </ImportWizardShell>
    )
  if (view.kind === 'notStarted')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <ImportNotice
          tone="neutral"
          role="status"
          title={t('release.notStartedTitle')}
        >
          {t('release.notStartedBody')}
        </ImportNotice>
      </ImportWizardShell>
    )
  if (view.kind === 'partial')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <PartialImportView detail={batch} />
      </ImportWizardShell>
    )
  if (view.kind === 'unavailable')
    return (
      <ImportWizardShell step={null} canEdit={canEdit}>
        <BatchStateNotice
          state="unavailable"
          status={t(`batchStatus.${view.status}`)}
        />
      </ImportWizardShell>
    )

  const step = editingMapping && canEdit ? 'map' : view.step
  return (
    <ImportWizardShell step={step} canEdit={canEdit}>
      {batch.duplicateFileOf && step === 'map' && (
        <DuplicateFileBanner duplicate={batch.duplicateFileOf} />
      )}
      {step === 'map' ? (
        <MapStep
          // A fresh form each time the merchant comes back to it.
          key={`map-${batch.mappingConfirmed}`}
          detail={batch}
          canEdit={canEdit}
          onSaved={() => setEditingMapping(false)}
        />
      ) : (
        <ReviewStep
          detail={batch}
          canEdit={canEdit}
          onBackToMapping={() => setEditingMapping(true)}
        />
      )}
    </ImportWizardShell>
  )
}
