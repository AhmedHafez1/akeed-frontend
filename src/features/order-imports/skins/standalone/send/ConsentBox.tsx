'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'

/**
 * The merchant's attestation that these customers expect a WhatsApp message.
 * Never pre-checked; sending waits for it, "import only" does not. The words
 * are the server's versioned statement -- the one the start records.
 */
export function ConsentBox({
  statement,
  checked,
  disabled,
  onChange,
}: {
  statement: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  const t = useTranslations('orderImport.send')
  const id = useId()
  return (
    <div className="rounded-card border-border bg-muted/30 border p-4">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="accent-primary focus-visible:ring-ring mt-1 size-5 shrink-0 rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:size-4"
        />
        <label
          htmlFor={id}
          className="text-foreground cursor-pointer text-sm leading-6"
        >
          <span className="sr-only">{t('consentLabel')}: </span>
          {statement}
        </label>
      </div>
    </div>
  )
}
