'use client'

import { useId, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Input, LoadingButton } from '@/shared/ui'
import { useFixOrderImportRowPhone } from '../../../api/orderImportMutations'
import {
  isOrderImportApiError,
  type OrderImportRow,
} from '../../../api/orderImportsApi'
import { useIssueText } from '../useIssueText'

/** A row left out for its phone, and not for anything else the file said. */
export function hasPhoneIssue(row: OrderImportRow): boolean {
  return row.issues.some(
    (issue) => issue.field === 'phone' && !issue.informational
  )
}

/**
 * The number a row's phone issue asks for, typed in place. The server reads
 * it the way the file would have been read; a good one readies the row and
 * the counts and quote follow.
 */
export function RowPhoneFix({
  batchId,
  row,
}: {
  batchId: string
  row: OrderImportRow
}) {
  const t = useTranslations('orderImport.send.phoneFix')
  const issueText = useIssueText()
  const fix = useFixOrderImportRowPhone(batchId)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const errorId = `${inputId}-error`

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!phone.trim()) return
    setError(null)
    fix.mutate(
      { rowNumber: row.rowNumber, phone: phone.trim() },
      {
        onError: (failure) => {
          if (
            isOrderImportApiError(failure) &&
            failure.code === 'IMPORT_ROW_PHONE_INVALID'
          )
            setError(
              issueText({
                code: failure.issue ?? 'PHONE_INVALID',
                field: 'phone',
              })
            )
          else setError(t('failed'))
        },
      }
    )
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-1" noValidate>
      <label htmlFor={inputId} className="sr-only">
        {t('label', { number: row.rowNumber })}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          dir="ltr"
          value={phone}
          placeholder={t('placeholder')}
          disabled={fix.isPending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setPhone(event.target.value)}
          className="h-11 min-w-0 flex-1 sm:h-9"
        />
        <LoadingButton
          type="submit"
          size="sm"
          variant="outline"
          className="h-11 shrink-0 sm:h-9"
          loading={fix.isPending}
          disabled={!phone.trim()}
        >
          {t('save')}
        </LoadingButton>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </form>
  )
}
