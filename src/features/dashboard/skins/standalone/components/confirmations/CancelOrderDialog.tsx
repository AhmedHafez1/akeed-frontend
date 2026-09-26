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

/** Asks before marking an unanswered order canceled; it cannot be undone. */
export function CancelOrderDialog({
  orderLabel,
  isCanceling,
  onConfirm,
  onDismiss,
}: {
  /** The order being canceled; null keeps the dialog closed. */
  orderLabel: string | null
  isCanceling: boolean
  onConfirm: () => void
  onDismiss: () => void
}) {
  const t = useTranslations('dashboard')

  return (
    <Dialog
      open={orderLabel !== null}
      onOpenChange={(open) => !open && !isCanceling && onDismiss()}
    >
      <DialogContent closeLabel={t('table.actions.keepOrder')}>
        <DialogHeader>
          <DialogTitle>
            {t('confirmations.actions.cancelTitle', {
              order: orderLabel ?? '',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('table.actions.cancelOrderConfirmDescription')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={isCanceling} onClick={onDismiss}>
            {t('table.actions.keepOrder')}
          </Button>
          <Button
            variant="destructive"
            disabled={isCanceling}
            onClick={onConfirm}
          >
            {isCanceling
              ? t('table.actions.cancelingOrder')
              : t('table.actions.confirmCancelOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
