'use client'

import { useId, useState, type FormEvent } from 'react'
import { AlertTriangle, Check, Copy, KeyRound, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCreateIntegrationKeyMutation } from '@/features/settings/api/integrationKeysApi'
import {
  integrationKeyErrorKey,
  type IntegrationKeyErrorKey,
} from '@/features/settings/domain/integrationKeyErrors'
import { useCopyToClipboard } from '@/features/settings/domain/useCopyToClipboard'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import {
  akButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  notify,
} from '@/shared/ui'

const logger = createLogger('Settings')

/** Mirrors the backend's name limit. */
const NAME_MAX_LENGTH = 60

interface CreateApiKeyDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Names a new key, then shows it once. The full key lives only in this
 * component's state: never in the query cache, browser storage or a URL. It
 * is dropped when the dialog closes and, with the component, when the
 * merchant leaves the tab.
 */
export function CreateApiKeyDialog({ open, onClose }: CreateApiKeyDialogProps) {
  const t = useTranslations('settings.standalone.page.apiKeys')
  const create = useCreateIntegrationKeyMutation()
  const fieldId = useId()
  const errorId = useId()
  const noteId = useId()
  const [name, setName] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [error, setError] = useState<
    IntegrationKeyErrorKey | 'nameRequired' | null
  >(null)
  const {
    copied,
    copy,
    reset: resetCopied,
  } = useCopyToClipboard((caught) => {
    logger.error('Failed to copy the API key', caught)
    notify.error({ message: t('reveal.copyError') })
  })

  const isCreating = create.isPending
  const isRevealing = secret !== null

  const close = () => {
    if (isCreating) return
    setSecret(null)
    setName('')
    setError(null)
    resetCopied()
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('nameRequired')
      return
    }
    setError(null)
    try {
      const created = await create.mutateAsync(trimmed)
      setSecret(created.secret)
    } catch (caught) {
      setError(integrationKeyErrorKey(caught))
    } finally {
      // The settled mutation would otherwise keep the secret as its `data`.
      create.reset()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent
        closeLabel={t('create.cancel')}
        closeDisabled={isCreating}
        className="border-border bg-card rounded-[18px] p-5 sm:max-w-lg sm:p-7"
        // Shown once: a stray click or Escape must not throw the key away.
        onInteractOutside={(event) => {
          if (isRevealing) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (isRevealing) event.preventDefault()
        }}
      >
        {isRevealing ? (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="text-ink leading-snug tracking-normal">
                {t('reveal.title')}
              </DialogTitle>
              <DialogDescription className="text-ink-muted">
                {t('reveal.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p
                role="alert"
                className="border-ak-warning-line bg-ak-warning-soft text-ak-warning text-ak-caption rounded-ak-card flex items-start gap-2.5 border px-3.5 py-3"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{t('reveal.once')}</span>
              </p>
              <div className="border-line bg-surface-sunken rounded-ak-control flex items-center gap-2 border p-2 ps-3">
                <code
                  dir="ltr"
                  aria-label={t('reveal.keyLabel')}
                  className="text-ink text-ak-caption min-w-0 flex-1 font-mono break-all select-all"
                >
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={() => void copy(secret)}
                  className={akButton({ variant: 'secondary', size: 'table' })}
                >
                  {copied ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  <span aria-live="polite">
                    {copied ? t('reveal.copied') : t('reveal.copy')}
                  </span>
                </button>
              </div>
              <p className="text-ak-caption text-ink-muted">
                {t('serverOnly')}
              </p>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={close}
                className={akButton({ variant: 'primary' })}
              >
                {t('reveal.done')}
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="text-ink leading-snug tracking-normal">
                {t('create.title')}
              </DialogTitle>
              <DialogDescription className="text-ink-muted">
                {t('create.description')}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              noValidate
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor={fieldId}
                  className="text-ak-caption text-ink font-semibold"
                >
                  {t('create.nameLabel')}
                </label>
                <Input
                  id={fieldId}
                  value={name}
                  maxLength={NAME_MAX_LENGTH}
                  autoComplete="off"
                  placeholder={t('create.namePlaceholder')}
                  disabled={isCreating}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={error === 'nameRequired'}
                  aria-describedby={cn(noteId, error && errorId)}
                />
                <p id={noteId} className="text-ak-caption text-ink-muted">
                  {t('create.nameHelp')}
                </p>
                {error && (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-ak-caption text-ak-danger"
                  >
                    {error === 'nameRequired'
                      ? t('create.nameRequired')
                      : t(`errors.${error}`)}
                  </p>
                )}
              </div>
              <p className="border-ak-info/30 bg-ak-info-soft text-ak-info text-ak-caption rounded-ak-card flex items-start gap-2.5 border px-3.5 py-3">
                <KeyRound
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{t('serverOnly')}</span>
              </p>
              <DialogFooter>
                <button
                  type="button"
                  onClick={close}
                  disabled={isCreating}
                  className={akButton({ variant: 'secondary' })}
                >
                  {t('create.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  aria-busy={isCreating}
                  className={akButton({ variant: 'primary' })}
                >
                  {isCreating && (
                    <Loader2
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                    />
                  )}
                  {t('create.submit')}
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
