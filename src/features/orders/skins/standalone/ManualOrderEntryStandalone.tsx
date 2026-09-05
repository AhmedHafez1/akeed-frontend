'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Controller } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  InternationalPhoneInput,
  Label,
} from '@/shared/ui'
import type { E164Value } from '@/shared/ui'
import { useManualOrderEntry } from '../../domain/useManualOrderEntry'
import { manualOrderCurrencies } from '../../domain/manualOrder.model'

interface ManualOrderEntryStandaloneProps {
  canCreate: boolean
  defaultCurrency?: string
  sourceConnected: boolean
}

function RequiredMark() {
  const t = useTranslations('manualOrder')
  return (
    <span className="ms-1 text-red-600" aria-label={t('required')}>
      *
    </span>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-red-600">
      {message}
    </p>
  ) : null
}

export function ManualOrderEntryStandalone({
  canCreate,
  defaultCurrency,
  sourceConnected,
}: ManualOrderEntryStandaloneProps) {
  const t = useTranslations('manualOrder')
  const { locale } = useLocaleInfo()
  const focusCustomerPhone = useCallback(() => {
    document.getElementById('manual-order-phone')?.focus()
  }, [])
  const entry = useManualOrderEntry(defaultCurrency, focusCustomerPhone)
  const {
    control,
    register,
    formState: { errors },
  } = entry.form
  const disabledReason = !sourceConnected
    ? t('sourceDisconnected')
    : !canCreate
      ? t('readOnly')
      : undefined
  const fieldsDisabled = entry.isSubmitting || entry.isLocked

  return (
    <Dialog open={entry.isOpen} onOpenChange={entry.onOpenChange}>
      <div className="flex flex-col items-end gap-1">
        <DialogTrigger asChild>
          <Button type="button" disabled={Boolean(disabledReason)}>
            <Plus aria-hidden="true" />
            {t('open')}
          </Button>
        </DialogTrigger>
        {disabledReason && (
          <p className="max-w-xs text-end text-xs text-slate-500">
            {disabledReason}
          </p>
        )}
      </div>

      <DialogContent
        closeLabel={t('close')}
        closeDisabled={entry.isSubmitting}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onEscapeKeyDown={(event) => {
          if (entry.isSubmitting) event.preventDefault()
        }}
        onPointerDownOutside={(event) => {
          if (entry.isSubmitting) event.preventDefault()
        }}
        onOpenAutoFocus={(event) => {
          if (entry.result) return
          event.preventDefault()
          queueMicrotask(focusCustomerPhone)
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {entry.result ? (
          <div className="space-y-5">
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-950"
            >
              <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                {t('success.acceptedStatus')}
              </span>
              <h3 className="mt-3 font-semibold">
                {entry.result.duplicate
                  ? t('success.duplicateTitle')
                  : t('success.title')}
              </h3>
              <p className="mt-1 text-sm text-sky-900">
                {entry.result.duplicate
                  ? t('success.duplicateDescription')
                  : t('success.description')}
              </p>
              <dl className="mt-4 text-sm">
                <div>
                  <dt className="font-medium">{t('success.orderId')}</dt>
                  <dd
                    dir="ltr"
                    className="mt-1 font-mono text-xs break-all text-slate-700"
                  >
                    {entry.result.orderId}
                  </dd>
                </div>
              </dl>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('close')}
                </Button>
              </DialogClose>
              <Button type="button" variant="outline" onClick={entry.resetFlow}>
                {t('success.createAnother')}
              </Button>
              <Button asChild>
                <Link href={withLocale('/verifications', locale)}>
                  {t('success.viewVerifications')}
                </Link>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-5" noValidate onSubmit={entry.submit}>
            {entry.feedback && (
              <div
                role="alert"
                aria-live="assertive"
                className={
                  entry.feedback.tone === 'warning'
                    ? 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'
                    : 'rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'
                }
              >
                {entry.feedback.message}
              </div>
            )}

            {entry.isLocked && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p>{t('retry.locked')}</p>
                {!entry.isConfirmingStartOver ? (
                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 h-auto p-0 text-amber-800"
                    onClick={() => entry.setIsConfirmingStartOver(true)}
                  >
                    {t('retry.startOver')}
                  </Button>
                ) : (
                  <div className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p>{t('retry.startOverWarning')}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={entry.resetFlow}
                      >
                        {t('retry.confirmStartOver')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => entry.setIsConfirmingStartOver(false)}
                      >
                        {t('retry.keepRetry')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="manual-order-phone">
                {t('fields.customerPhone.label')}
                <RequiredMark />
              </Label>
              <Controller
                name="customerPhone"
                control={control}
                render={({ field }) => (
                  <InternationalPhoneInput
                    id="manual-order-phone"
                    name={field.name}
                    value={(field.value || undefined) as E164Value | undefined}
                    onChange={(value) => field.onChange(value ?? '')}
                    onBlur={field.onBlur}
                    placeholder={t('fields.customerPhone.placeholder')}
                    required
                    disabled={fieldsDisabled}
                    aria-invalid={Boolean(errors.customerPhone)}
                    aria-describedby={
                      errors.customerPhone
                        ? 'manual-order-phone-error'
                        : 'manual-order-phone-help'
                    }
                    className="mt-2"
                  />
                )}
              />
              <p
                id="manual-order-phone-help"
                className="mt-1 text-xs text-slate-500"
              >
                {t('fields.customerPhone.help')}
              </p>
              <FieldError
                id="manual-order-phone-error"
                message={errors.customerPhone?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="manual-order-name">
                  {t('fields.customerName.label')}
                </Label>
                <Input
                  id="manual-order-name"
                  maxLength={255}
                  disabled={fieldsDisabled}
                  aria-invalid={Boolean(errors.customerName)}
                  aria-describedby={
                    errors.customerName ? 'manual-order-name-error' : undefined
                  }
                  className="mt-2"
                  {...register('customerName')}
                />
                <FieldError
                  id="manual-order-name-error"
                  message={errors.customerName?.message}
                />
              </div>
              <div>
                <Label htmlFor="manual-order-reference">
                  {t('fields.orderNumber.label')}
                </Label>
                <Input
                  id="manual-order-reference"
                  dir="ltr"
                  maxLength={100}
                  disabled={fieldsDisabled}
                  aria-invalid={Boolean(errors.orderNumber)}
                  aria-describedby={
                    errors.orderNumber
                      ? 'manual-order-reference-error'
                      : undefined
                  }
                  className="mt-2"
                  {...register('orderNumber')}
                />
                <FieldError
                  id="manual-order-reference-error"
                  message={errors.orderNumber?.message}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="manual-order-total">
                  {t('fields.totalPrice.label')}
                  <RequiredMark />
                </Label>
                <Input
                  id="manual-order-total"
                  dir="ltr"
                  inputMode="decimal"
                  placeholder={t('fields.totalPrice.placeholder')}
                  disabled={fieldsDisabled}
                  aria-invalid={Boolean(errors.totalPrice)}
                  aria-describedby={
                    errors.totalPrice ? 'manual-order-total-error' : undefined
                  }
                  className="mt-2"
                  {...register('totalPrice')}
                />
                <FieldError
                  id="manual-order-total-error"
                  message={errors.totalPrice?.message}
                />
              </div>
              <div>
                <Label htmlFor="manual-order-currency">
                  {t('fields.currency.label')}
                  <RequiredMark />
                </Label>
                <select
                  id="manual-order-currency"
                  disabled={fieldsDisabled}
                  aria-invalid={Boolean(errors.currency)}
                  aria-describedby={
                    errors.currency ? 'manual-order-currency-error' : undefined
                  }
                  className="mt-2 h-12 w-full rounded-lg border-2 border-gray-200 bg-white px-4 text-base focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('currency')}
                >
                  <option value="">{t('fields.currency.placeholder')}</option>
                  {manualOrderCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="manual-order-currency-error"
                  message={errors.currency?.message}
                />
              </div>
            </div>

            <fieldset disabled={fieldsDisabled}>
              <legend className="text-sm font-medium text-slate-900">
                {t('fields.paymentMethod.label')}
                <RequiredMark />
              </legend>
              <label className="mt-2 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <input
                  type="radio"
                  value="cash_on_delivery"
                  className="mt-1 h-4 w-4"
                  {...register('paymentMethod')}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {t('fields.paymentMethod.cod')}
                  </span>
                  <span className="mt-1 block text-xs text-slate-600">
                    {t('fields.paymentMethod.help')}
                  </span>
                </span>
              </label>
            </fieldset>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={entry.isSubmitting}
                >
                  {t('cancel')}
                </Button>
              </DialogClose>
              {entry.recoveryMode === 'retry' ? (
                <Button
                  type="button"
                  disabled={entry.isSubmitting}
                  onClick={() => void entry.retry()}
                >
                  {entry.isSubmitting ? t('retry.retrying') : t('retry.retry')}
                </Button>
              ) : entry.recoveryMode === 'conflict' ? null : (
                <Button type="submit" disabled={entry.isSubmitting}>
                  {entry.isSubmitting ? t('submitting') : t('submit')}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
