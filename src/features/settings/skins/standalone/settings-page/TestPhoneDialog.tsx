'use client'

import { useId, type FormEvent } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { TestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
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
import {
  InternationalPhoneInput,
  type E164Value,
} from '@/shared/ui/international-phone-input'

interface TestPhoneDialogProps {
  prompt: TestPhonePrompt
}

/**
 * Asks for the merchant's own WhatsApp number at the moment a test needs it,
 * then saves it and sends the test. Also how a saved number is changed.
 */
export function TestPhoneDialog({ prompt }: TestPhoneDialogProps) {
  const t = useTranslations('settings.embedded.message.testPhone')
  const fieldId = useId()
  const noteId = useId()
  const errorId = useId()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void prompt.submit()
  }

  return (
    <Dialog
      open={prompt.isOpen}
      onOpenChange={(open) => {
        if (!open && !prompt.isSubmitting) prompt.close()
      }}
    >
      <DialogContent
        closeLabel={t('close')}
        closeDisabled={prompt.isSubmitting}
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

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <InternationalPhoneInput
              id={fieldId}
              label={t('label')}
              value={(prompt.phone || undefined) as E164Value | undefined}
              defaultCountry={prompt.defaultCountry}
              onChange={(value) => prompt.setPhone(value ?? '')}
              disabled={prompt.isSubmitting}
              aria-invalid={prompt.error === 'invalid'}
              aria-describedby={
                cn(prompt.isSuggested && noteId, prompt.error && errorId) ||
                undefined
              }
              validateWhileTyping={false}
              errorTone="warning"
            />
            {prompt.isSuggested && (
              <p id={noteId} className="text-ak-caption text-ink-muted">
                {t('suggested')}
              </p>
            )}
            {prompt.error && (
              <p
                id={errorId}
                role="alert"
                className="text-ak-caption text-ak-warning"
              >
                {t(prompt.error)}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={prompt.close}
              disabled={prompt.isSubmitting}
              className={akButton({ variant: 'secondary' })}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={prompt.isSubmitting}
              aria-busy={prompt.isSubmitting}
              className={akButton({ variant: 'primary' })}
            >
              {prompt.isSubmitting ? (
                <Loader2
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Send aria-hidden="true" className="rtl:-scale-x-100" />
              )}
              {t('submit')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
