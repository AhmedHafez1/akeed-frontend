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
  LoadingButton,
} from '@/shared/ui'
import { ImportNotice } from './ImportNotice'

interface StopImportDialogProps {
  open: boolean
  pending: boolean
  failed: boolean
  /** Customers not contacted yet: the ones stopping gives up. */
  remaining: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Asks before the unsent orders are given up for good (AC12). */
export function StopImportDialog({
  open,
  pending,
  failed,
  remaining,
  onOpenChange,
  onConfirm,
}: StopImportDialogProps) {
  const t = useTranslations('orderImport.stop')
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent closeLabel={t('cancel')} closeDisabled={pending}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('body', { count: remaining })}
          </DialogDescription>
        </DialogHeader>
        {failed && (
          <ImportNotice tone="critical" role="alert">
            {t('failed')}
          </ImportNotice>
        )}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={pending}
            onClick={onConfirm}
          >
            {t('confirm')}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
