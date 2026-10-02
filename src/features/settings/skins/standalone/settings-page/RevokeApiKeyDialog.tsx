'use client'

import { Loader2 } from 'lucide-react'
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

/** Asks before revoking a key; requests with it fail at once, for good. */
export function RevokeApiKeyDialog({
  keyName,
  isRevoking,
  error,
  onConfirm,
  onDismiss,
}: {
  /** The key being revoked; null keeps the dialog closed. */
  keyName: string | null
  isRevoking: boolean
  /** Already translated. */
  error: string | null
  onConfirm: () => void
  onDismiss: () => void
}) {
  const t = useTranslations('settings.standalone.page.apiKeys.revoke')

  return (
    <Dialog
      open={keyName !== null}
      onOpenChange={(open) => !open && !isRevoking && onDismiss()}
    >
      <DialogContent
        closeLabel={t('keep')}
        closeDisabled={isRevoking}
        className="border-border bg-card rounded-[18px] p-5 sm:max-w-md sm:p-7"
      >
        <DialogHeader className="text-start">
          <DialogTitle className="text-ink leading-snug tracking-normal">
            {t('title', { name: keyName ?? '' })}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-ak-caption text-ak-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isRevoking}
            className={akButton({ variant: 'secondary' })}
          >
            {t('keep')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRevoking}
            aria-busy={isRevoking}
            className={cn(
              akButton({ variant: 'primary' }),
              'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {isRevoking && (
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
