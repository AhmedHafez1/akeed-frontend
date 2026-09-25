'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Controller } from 'react-hook-form'
import { ChevronDown, CircleCheck, ClipboardCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
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
import { orderCurrencies } from '@/shared/commerce/orderCommerce'

interface ManualOrderEntryStandaloneProps {
  canCreate: boolean
  sourceConnected: boolean
  isAtPlanLimit?: boolean
  onAccepted?: () => void
  triggerClassName?: string
  triggerLabelClassName?: string
  disabledReasonOverride?: string
  showDisabledReason?: boolean
}

function RequiredMark() {
  const t = useTranslations('manualOrder')
  return (
    <span className="text-destructive ms-1" aria-label={t('required')}>
      *
    </span>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p
      id={id}
      role="alert"
      className="text-destructive mt-1 text-xs font-medium"
    >
      {message}
    </p>
  ) : null
}

export function ManualOrderEntryStandalone({
  canCreate,
  sourceConnected,
  isAtPlanLimit = false,
  onAccepted,
  triggerClassName,
  triggerLabelClassName,
  disabledReasonOverride,
  showDisabledReason = true,
}: ManualOrderEntryStandaloneProps) {
  const t = useTranslations('manualOrder')
  const tCredits = useTranslations('creditErrors')
  const { locale } = useLocaleInfo()
  const focusCustomerPhone = useCallback(() => {
    document.getElementById('manual-order-phone')?.focus()
  }, [])
  const entry = useManualOrderEntry(focusCustomerPhone, onAccepted)
  const {
    control,
    register,
    formState: { errors },
  } = entry.form
  const disabledReason =
    disabledReasonOverride ??
    (!sourceConnected
      ? t('sourceDisconnected')
      : !canCreate
        ? t('readOnly')
        : isAtPlanLimit
          ? t('planLimitReasonLabel')
          : undefined)
  const fieldsDisabled = entry.isSubmitting || entry.isLocked

  return (
    <Dialog open={entry.isOpen} onOpenChange={entry.onOpenChange}>
      <div className="flex flex-col items-end gap-1">
        <DialogTrigger asChild>
          <Button
            type="button"
            disabled={Boolean(disabledReason)}
            aria-label={t('open')}
            title={disabledReason}
            className={cn(
              'bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-lg shadow-sm',
              triggerClassName
            )}
          >
            <CircleCheck aria-hidden="true" className="size-[18px] shrink-0" />
            <span className={triggerLabelClassName}>{t('open')}</span>
          </Button>
        </DialogTrigger>
        {disabledReason && showDisabledReason && (
          <p className="text-muted-foreground max-w-xs text-end text-xs">
            {disabledReason}
          </p>
        )}
      </div>

      <DialogContent
        closeLabel={t('close')}
        closeDisabled={entry.isSubmitting}
        className="border-border bg-card max-h-[90vh] overflow-y-auto rounded-[18px] p-5 sm:max-w-[640px] sm:p-7"
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
            <span className="text-primary bg-primary-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
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
              className="border-primary-border bg-primary-subtle text-primary-subtle-foreground rounded-xl border p-4"
            >
              <h3 className="font-semibold">
                {entry.result.duplicate
                  ? t('success.duplicateTitle')
                  : t('success.title')}
              </h3>
              <p className="text-primary-subtle-foreground mt-1 text-sm">
                {entry.result.duplicate
                  ? t('success.duplicateDescription')
                  : t('success.description')}
              </p>
            </div>

            <DialogFooter className="border-border border-t pt-5">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('close')}
                </Button>
              </DialogClose>
              <Button type="button" variant="outline" onClick={entry.resetFlow}>
                {t('success.createAnother')}
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
                    ? 'border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-xl border p-3 text-sm'
                    : 'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-xl border p-3 text-sm'
                }
              >
                <p>{entry.feedback.message}</p>
                {entry.feedback.billingLink && (
                  <Link
                    href={withLocale('/billing', locale)}
                    className="mt-2 inline-block font-semibold underline underline-offset-4"
                  >
                    {tCredits('billingLink')}
                  </Link>
                )}
              </div>
            )}

            {entry.isLocked && (
              <div className="border-border bg-muted/50 text-foreground/80 rounded-xl border p-3 text-sm">
                <p>{t('retry.locked')}</p>
                {!entry.isConfirmingStartOver ? (
                  <Button
                    type="button"
                    variant="link"
                    className="text-warning-subtle-foreground mt-2 h-auto p-0"
                    onClick={() => entry.setIsConfirmingStartOver(true)}
                  >
                    {t('retry.startOver')}
                  </Button>
                ) : (
                  <div className="border-warning-border bg-warning-subtle mt-3 space-y-3 rounded-lg border p-3">
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
                          : undefined
                      }
                      className="mt-2"
                    />
                  )}
                />
                <FieldError
                  id="manual-order-phone-error"
                  message={errors.customerPhone?.message}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="manual-order-name">
                    {t('fields.customerName.label')}
                    <RequiredMark />
                  </Label>
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
                    required
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
                    <RequiredMark />
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
                    required
                    className="mt-2 text-left rtl:text-right"
                    {...register('orderNumber')}
                  />
                  <FieldError
                    id="manual-order-reference-error"
                    message={errors.orderNumber?.message}
                  />
                </div>
              </div>
            </div>

            <div className="border-border space-y-4 border-t pt-5">
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
                      className="border-border bg-card focus:border-primary h-12 w-full appearance-none rounded-lg border-2 py-2 ps-4 pe-11 text-left text-base focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right"
                      {...register('currency')}
                    >
                      <option value="">
                        {t('fields.currency.placeholder')}
                      </option>
                      {orderCurrencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="text-muted-foreground pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2"
                    />
                  </div>
                  <FieldError
                    id="manual-order-currency-error"
                    message={errors.currency?.message}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-border border-t pt-5">
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
                <Button
                  type="submit"
                  disabled={entry.isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
                >
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
