'use client'

import { useTranslations } from 'next-intl'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import type { ManualConfirmationTarget } from '@/features/dashboard/domain/useManualConfirmation'

/**
 * Asks before a manual confirmation: it is final, and it stops the customer's
 * reminders. Shared by the needs-action card and the confirmations table.
 */
export function ManualConfirmDialog({
  target,
  isConfirming,
  onConfirm,
  onDismiss,
}: {
  target: ManualConfirmationTarget | null
  isConfirming: boolean
  onConfirm: () => void
  onDismiss: () => void
}) {
  const t = useTranslations('dashboard')

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => !open && onDismiss()}
    >
      <DialogContent
        closeLabel={t('overview.needsAction.confirmDialog.cancel')}
      >
        <DialogHeader>
          <DialogTitle>
            {t('overview.needsAction.confirmDialog.title', {
              order: target?.orderLabel ?? '',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('standalone.manualConfirmBody')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={isConfirming} onClick={onDismiss}>
            {t('overview.needsAction.confirmDialog.cancel')}
          </Button>
          <Button disabled={isConfirming} onClick={onConfirm}>
            {t('overview.needsAction.confirmDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
