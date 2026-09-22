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

interface DiscardImportDialogProps {
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Asks before a draft and its rows are deleted (story AC9). */
export function DiscardImportDialog({
  open,
  pending,
  onOpenChange,
  onConfirm,
}: DiscardImportDialogProps) {
  const t = useTranslations('orderImport.discard')
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent closeLabel={t('cancel')} closeDisabled={pending}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('body')}</DialogDescription>
        </DialogHeader>
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
