'use client'

import { HelpCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import {
  akButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'

/**
 * Asks before disconnecting the number. A WhatsApp Business app number also
 * has to be disconnected in that app, which Akeed cannot do for the merchant.
 */
export function WhatsappDisconnectDialog({
  open,
  coexistence,
  isPending,
  error,
  onConfirm,
  onDismiss,
}: {
  open: boolean
  /** Connected through the WhatsApp Business app. */
  coexistence: boolean
  isPending: boolean
  /** A key under `whatsappConnect.errors`, or null. */
  error: string | null
  onConfirm: () => void
  onDismiss: () => void
}) {
  const t = useTranslations('whatsappConnect.tab.disconnect')
  const tErrors = useTranslations('whatsappConnect.errors')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !isPending && onDismiss()}
    >
      <DialogContent
        closeLabel={t('keep')}
        closeDisabled={isPending}
        className="border-border bg-card rounded-[18px] p-5 sm:max-w-lg sm:p-7"
      >
        <DialogHeader className="text-start">
          <DialogTitle className="text-ink leading-snug tracking-normal">
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t('body')}
            {coexistence && <> {t('coexistence')}</>}
          </DialogDescription>
        </DialogHeader>
        <p className="border-ak-warning-line bg-ak-warning-soft text-ak-warning text-ak-body rounded-ak-control flex items-start gap-3 border px-4 py-3">
          <HelpCircle aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
          {t('history')}
        </p>
        {error && (
          <p role="alert" className="text-ak-caption text-ak-danger">
            {error === 'ownerRequired' ? tErrors('ownerRequired') : t('error')}
          </p>
        )}
        <DialogFooter>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isPending}
            className={akButton({ variant: 'secondary' })}
          >
            {t('keep')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            aria-busy={isPending}
            className={cn(akButton({ variant: 'primary' }))}
          >
            {isPending && (
              <Loader2
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            )}
            {t('confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
