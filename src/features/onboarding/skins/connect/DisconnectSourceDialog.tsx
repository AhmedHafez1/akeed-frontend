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

export interface DisconnectSourceDialogProps {
  open: boolean
  isDisconnecting: boolean
  /** Already translated. */
  error: string | null
  onConfirm: () => void
  onDismiss: () => void
}

/**
 * Asks before disconnecting a store. It says what stops at once, what is
 * kept, and what stays at the provider until the merchant removes it there.
 * The words come from the source skin: `title`, `description`, `keep`,
 * `confirm` and one `effects.<key>` line per effect.
 */
export function DisconnectSourceDialog({
  open,
  isDisconnecting,
  error,
  onConfirm,
  onDismiss,
  namespace,
  effects,
}: DisconnectSourceDialogProps & {
  /** The source's own `disconnect` messages. */
  namespace: string
  effects: readonly string[]
}) {
  const t = useTranslations(namespace)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !isDisconnecting && onDismiss()}
    >
      <DialogContent
        closeLabel={t('keep')}
        closeDisabled={isDisconnecting}
        className="border-border bg-card rounded-[18px] p-5 sm:max-w-md sm:p-7"
      >
        <DialogHeader className="text-start">
          <DialogTitle className="text-ink leading-snug tracking-normal">
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <ul className="text-ink list-disc space-y-1.5 ps-5 text-start text-sm">
          {effects.map((effect) => (
            <li key={effect}>{t(`effects.${effect}`)}</li>
          ))}
        </ul>
        {error && (
          <p role="alert" className="text-ak-caption text-ak-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isDisconnecting}
            className={akButton({ variant: 'secondary' })}
          >
            {t('keep')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDisconnecting}
            aria-busy={isDisconnecting}
            className={cn(
              akButton({ variant: 'primary' }),
              'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {isDisconnecting && (
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
