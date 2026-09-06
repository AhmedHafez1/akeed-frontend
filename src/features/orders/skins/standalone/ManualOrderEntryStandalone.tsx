'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Controller } from 'react-hook-form'
import { ChevronDown, ClipboardCheck, Plus, ShieldCheck } from 'lucide-react'
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
  onAccepted?: () => void
  triggerClassName?: string
}

function RequiredMark() {
  const t = useTranslations('manualOrder')
  return (
    <span className="ms-1 text-red-600" aria-label={t('required')}>
      *
    </span>
  )
}

function OptionalBadge() {
  const t = useTranslations('manualOrder')
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
      {t('optional')}
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
  onAccepted,
  triggerClassName,
}: ManualOrderEntryStandaloneProps) {
  const t = useTranslations('manualOrder')
  const { locale } = useLocaleInfo()
  const focusCustomerPhone = useCallback(() => {
    document.getElementById('manual-order-phone')?.focus()
  }, [])
  const entry = useManualOrderEntry(
    defaultCurrency,
    focusCustomerPhone,
    onAccepted
  )
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
          <Button
            type="button"
            disabled={Boolean(disabledReason)}
            className={triggerClassName}
          >
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
        className="max-h-[90vh] overflow-y-auto rounded-[18px] border-stone-200 bg-white p-5 sm:max-w-[640px] sm:p-7"
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
        <DialogHeader className="text-start">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{t('title')}</DialogTitle>
              <DialogDescription>{t('description')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {entry.result ? (
          <div className="space-y-5">
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"
            >
              <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                {t('success.acceptedStatus')}
              </span>
              <h3 className="mt-3 font-semibold">
                {entry.result.duplicate
                  ? t('success.duplicateTitle')
                  : t('success.title')}
              </h3>
              <p className="mt-1 text-sm text-emerald-900">
                {entry.result.duplicate
                  ? t('success.duplicateDescription')
                  : t('success.description')}
              </p>
              <dl className="mt-4 text-sm">
                <div>
                  <dt className="font-medium">{t('success.orderId')}</dt>
                  <dd
                    dir="ltr"
                    className="mt-1 text-left font-mono text-xs break-all text-slate-700 rtl:text-right"
                  >
                    {entry.result.orderId}
                  </dd>
                </div>
              </dl>
            </div>

            <DialogFooter className="border-t border-stone-200 pt-5">
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

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('sections.customerDetails')}
              </h3>

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
                      value={
                        (field.value || undefined) as E164Value | undefined
                      }
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
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label htmlFor="manual-order-name">
                      {t('fields.customerName.label')}
                    </Label>
                    <OptionalBadge />
                  </div>
                  <Input
                    id="manual-order-name"
                    maxLength={255}
                    disabled={fieldsDisabled}
                    aria-invalid={Boolean(errors.customerName)}
                    aria-describedby={
                      errors.customerName
                        ? 'manual-order-name-error'
                        : undefined
                    }
                    {...register('customerName')}
                  />
                  <FieldError
                    id="manual-order-name-error"
                    message={errors.customerName?.message}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label htmlFor="manual-order-reference">
                      {t('fields.orderNumber.label')}
                    </Label>
                    <OptionalBadge />
                  </div>
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
                    className="text-left rtl:text-right"
                    {...register('orderNumber')}
                  />
                  <FieldError
                    id="manual-order-reference-error"
                    message={errors.orderNumber?.message}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-stone-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('sections.orderDetails')}
              </h3>

              <div className="grid gap-4 sm:grid-cols-5">
                <div className="sm:col-span-3">
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
                    className="mt-2 text-left rtl:text-right"
                    {...register('totalPrice')}
                  />
                  <FieldError
                    id="manual-order-total-error"
                    message={errors.totalPrice?.message}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="manual-order-currency">
                    {t('fields.currency.label')}
                    <RequiredMark />
                  </Label>
                  <div className="relative mt-2">
                    <select
                      id="manual-order-currency"
                      dir="ltr"
                      disabled={fieldsDisabled}
                      aria-invalid={Boolean(errors.currency)}
                      aria-describedby={
                        errors.currency
                          ? 'manual-order-currency-error'
                          : undefined
                      }
                      className="h-12 w-full appearance-none rounded-lg border-2 border-gray-200 bg-white py-2 ps-4 pe-11 text-left text-base focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right"
                      {...register('currency')}
                    >
                      <option value="">
                        {t('fields.currency.placeholder')}
                      </option>
                      {manualOrderCurrencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                  <FieldError
                    id="manual-order-currency-error"
                    message={errors.currency?.message}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  {t('trust.title')}
                </p>
                <p className="mt-0.5 text-xs text-emerald-800">
                  {t('trust.description')}
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>

            <DialogFooter className="border-t border-stone-200 pt-5">
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
