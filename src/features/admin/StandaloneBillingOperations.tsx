'use client'

import { useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { SupportedLocale } from '@/shared/lib/locale'
import type { AdminApiError } from './adminApi'
import { Mono } from './StandaloneBillingAccountSections'
import { errorMessage } from './StandaloneBillingErrors'
import {
  PROVIDER_ACTIONS,
  type AdjustmentPreview,
  type AdjustmentResult,
  type BalanceProjection,
  type DispatchResolutionChoice,
  type DispatchResolutionResult,
  type HoldRow,
  type InquiryResult,
  type ProviderAction,
  type ProviderActionResult,
  type PurchaseRow,
  type ReconciliationReport,
  type RepairPreview,
  type RepairResult,
} from './standalone-billing-operations.model'
import {
  applyAdjustment,
  applyRepair,
  previewAdjustment,
  previewRepair,
  reconcilePurchase,
  recordProviderAction,
  resolveDispatch,
} from './standaloneBillingOperationsApi'
import { formatNumber, formatSigned } from './standaloneBillingFormat'
import { toAdminApiError } from './useStandaloneBillingAccount'

const MAX_ADJUSTMENT = 10_000
const REASON_LIMIT = 500
/** Refusals after which the reviewed preview can no longer be applied. */
const PREVIEW_ENDING_CODES = new Set([
  'BILLING_PREVIEW_STALE',
  'BILLING_PREVIEW_NOT_FOUND',
  'BILLING_PREVIEW_ALREADY_APPLIED',
  'BILLING_IDEMPOTENCY_CONFLICT',
])

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

/** One staff operation's request lifecycle. */
function useOperation<T>() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [result, setResult] = useState<T | null>(null)
  async function run(work: () => Promise<T>) {
    if (busy) return null
    setBusy(true)
    setError(null)
    try {
      const value = await work()
      setResult(value)
      return value
    } catch (cause) {
      console.error('[Admin] Standalone billing operation failed', cause)
      setError(toAdminApiError(cause))
      return null
    } finally {
      setBusy(false)
    }
  }
  function reset() {
    setError(null)
    setResult(null)
  }
  return { busy, error, result, run, reset, setError }
}

function OperationError({ error }: { error: AdminApiError | null }) {
  const t = useTranslations('adminBillingOps')
  if (!error) return null
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
    >
      {errorMessage(t, error)}
      {error.requestId && (
        <span className="mt-1 block">
          <Mono>{error.requestId}</Mono>
        </span>
      )}
    </p>
  )
}

function Field({
  label,
  help,
  children,
  htmlFor,
}: {
  label: string
  help?: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {help && (
        <p id={`${htmlFor}-help`} className="text-xs text-slate-500">
          {help}
        </p>
      )}
    </div>
  )
}

function ReasonField({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}) {
  const t = useTranslations('adminBillingOps')
  const id = useId()
  return (
    <Field
      htmlFor={id}
      label={label ?? t('ops.reason')}
      help={t('ops.reasonHelp')}
    >
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={REASON_LIMIT}
        rows={3}
        required
        disabled={disabled}
        aria-describedby={`${id}-help`}
        className={inputClass}
      />
    </Field>
  )
}

function ProjectionChange({
  before,
  after,
  locale,
}: {
  before: BalanceProjection
  after: BalanceProjection
  locale: SupportedLocale
}) {
  const t = useTranslations('adminBillingOps')
  const rows: [string, keyof BalanceProjection][] = [
    [t('balance.available'), 'availableCredits'],
    [t('balance.posted'), 'postedBalance'],
    [t('balance.held'), 'heldCredits'],
    [t('balance.debt'), 'debtCredits'],
  ]
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, key]) => (
        <div key={key} className="rounded-lg bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd
            className={cn(
              'mt-1 text-sm tabular-nums',
              before[key] !== after[key] && 'font-semibold text-slate-950'
            )}
          >
            {t('ops.change', {
              before: formatNumber(before[key], locale),
              after: formatNumber(after[key], locale),
            })}
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface PanelProps {
  orgId: string
  locale: SupportedLocale
  canApply: boolean
  onChanged: () => void
}

/**
 * Signed credit adjustment: preview first, then apply exactly what was
 * reviewed. One idempotency key belongs to one reviewed preview, so a
 * network retry cannot post twice and a new preview starts a new key.
 */
export function AdjustmentPanel({
  orgId,
  locale,
  canApply,
  canPreview,
  onChanged,
}: PanelProps & { canPreview: boolean }) {
  const t = useTranslations('adminBillingOps')
  const quantityId = useId()
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState<AdjustmentPreview | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)
  const [applied, setApplied] = useState<AdjustmentResult | null>(null)
  const previewing = useOperation<AdjustmentPreview>()
  const applying = useOperation<AdjustmentResult>()
  const parsed = Number(quantity)
  const valid =
    /^-?\d+$/.test(quantity.trim()) &&
    parsed !== 0 &&
    Math.abs(parsed) <= MAX_ADJUSTMENT
  const busy = previewing.busy || applying.busy

  async function requestPreview() {
    if (!valid || busy) return
    setApplied(null)
    applying.reset()
    const next = await previewing.run(() => previewAdjustment(orgId, parsed))
    setPreview(next)
    setIdempotencyKey(next ? crypto.randomUUID() : null)
  }

  async function apply() {
    if (!preview || !idempotencyKey || !reason.trim() || busy) return
    const result = await applying.run(() =>
      applyAdjustment(orgId, preview, reason.trim(), idempotencyKey)
    )
    if (result) {
      setApplied(result)
      setPreview(null)
      setIdempotencyKey(null)
      setReason('')
      setQuantity('')
      onChanged()
    }
  }

  const previewEnded =
    applying.error?.code && PREVIEW_ENDING_CODES.has(applying.error.code)

  return (
    <section
      aria-labelledby="billing-adjustment"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 id="billing-adjustment" className="text-base font-semibold">
          {t('ops.adjustment.title')}
        </h2>
        <p className="mt-1 max-w-3xl text-xs text-slate-500">
          {t('ops.adjustment.description')}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Field
            htmlFor={quantityId}
            label={t('ops.adjustment.quantity')}
            help={t('ops.adjustment.quantityHelp', { max: MAX_ADJUSTMENT })}
          >
            <input
              id={quantityId}
              type="number"
              inputMode="numeric"
              step={1}
              min={-MAX_ADJUSTMENT}
              max={MAX_ADJUSTMENT}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value)
                setPreview(null)
                setIdempotencyKey(null)
              }}
              disabled={!canPreview || busy}
              aria-describedby={`${quantityId}-help`}
              aria-invalid={quantity !== '' && !valid}
              className={inputClass}
              dir="ltr"
            />
          </Field>
        </div>
        <Button
          variant="outline"
          onClick={requestPreview}
          disabled={!canPreview || !valid || busy}
        >
          {previewing.busy ? t('ops.previewing') : t('ops.preview')}
        </Button>
      </div>
      <OperationError error={previewing.error} />
      {preview && (
        <div
          className="space-y-3 rounded-xl border border-emerald-200 p-4"
          aria-live="polite"
        >
          <p className="text-sm font-medium">
            {t('ops.adjustment.review', {
              quantity: formatSigned(preview.quantity, locale),
            })}
          </p>
          <ProjectionChange
            before={preview.before}
            after={preview.after}
            locale={locale}
          />
          {preview.after.debtCredits > preview.before.debtCredits && (
            <p className="text-sm text-red-800">
              {t('ops.adjustment.createsDebt')}
            </p>
          )}
          <ReasonField value={reason} onChange={setReason} disabled={busy} />
          {!canApply && (
            <p className="text-sm text-slate-600">{t('ops.applyLocked')}</p>
          )}
          <OperationError error={applying.error} />
          {previewEnded ? (
            <Button variant="outline" onClick={requestPreview} disabled={busy}>
              {t('ops.previewAgain')}
            </Button>
          ) : (
            <Button
              onClick={apply}
              disabled={!canApply || !reason.trim() || busy}
            >
              {applying.busy
                ? t('ops.applying')
                : t('ops.adjustment.apply', {
                    quantity: formatSigned(preview.quantity, locale),
                  })}
            </Button>
          )}
        </div>
      )}
      {applied && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {t(`ops.adjustment.outcomes.${applied.outcome}`, {
            quantity: formatSigned(applied.quantity, locale),
            posted: formatNumber(applied.after.postedBalance, locale),
          })}
        </p>
      )}
    </section>
  )
}

/**
 * Rebuilds a drifted projection from the ledger and held reservations. It
 * appears only while the account needs it, and refuses contradictory
 * records instead of choosing between them.
 */
export function RepairPanel({
  orgId,
  locale,
  canApply,
  onChanged,
  report,
}: PanelProps & { report: ReconciliationReport }) {
  const t = useTranslations('adminBillingOps')
  const [reason, setReason] = useState('')
  const previewing = useOperation<RepairPreview>()
  const applying = useOperation<RepairResult>()
  const busy = previewing.busy || applying.busy
  const preview = previewing.result
  if (report.consistent && !report.contradictions.length && !applying.result)
    return null

  async function apply() {
    if (!preview?.previewId || !preview.fingerprint || !reason.trim()) return
    const result = await applying.run(() =>
      applyRepair(
        orgId,
        { previewId: preview.previewId!, fingerprint: preview.fingerprint! },
        reason.trim()
      )
    )
    if (result) {
      previewing.reset()
      setReason('')
      onChanged()
    }
  }

  return (
    <section
      aria-labelledby="billing-repair"
      className="space-y-4 rounded-2xl border border-amber-300 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 id="billing-repair" className="text-base font-semibold">
          {t('ops.repair.title')}
        </h2>
        <p className="mt-1 max-w-3xl text-xs text-slate-500">
          {t('ops.repair.description')}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          applying.reset()
          void previewing.run(() => previewRepair(orgId))
        }}
        disabled={busy}
      >
        {previewing.busy ? t('ops.previewing') : t('ops.repair.preview')}
      </Button>
      <OperationError error={previewing.error} />
      {preview && (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm font-medium">
            {t(`ops.repair.outcomes.${preview.outcome}`, {
              entries: formatNumber(preview.ledgerEntries, locale),
            })}
          </p>
          {preview.outcome === 'repairable' && (
            <>
              <ProjectionChange
                before={preview.before}
                after={preview.after}
                locale={locale}
              />
              <ReasonField
                value={reason}
                onChange={setReason}
                disabled={busy}
              />
              {!canApply && (
                <p className="text-sm text-slate-600">{t('ops.applyLocked')}</p>
              )}
              <OperationError error={applying.error} />
              <Button
                onClick={apply}
                disabled={!canApply || !reason.trim() || busy}
              >
                {applying.busy ? t('ops.applying') : t('ops.repair.apply')}
              </Button>
            </>
          )}
        </div>
      )}
      {applying.result && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {t(`ops.repair.done.${applying.result.outcome}`, {
            posted: formatNumber(applying.result.after.postedBalance, locale),
            held: formatNumber(applying.result.after.heldCredits, locale),
          })}
        </p>
      )}
    </section>
  )
}

interface OperationDialogProps {
  trigger: string
  triggerLabel: string
  title: string
  description: string
  disabled: boolean
  busy: boolean
  done: boolean
  onClosed: () => void
  children: ReactNode
  footer: ReactNode
}

/**
 * A modal confirmation step. Focus is trapped while open and returns to the
 * row's button on close; it cannot be dismissed while a request is running.
 */
function OperationDialog({
  trigger,
  triggerLabel,
  title,
  description,
  disabled,
  busy,
  done,
  onClosed,
  children,
  footer,
}: OperationDialogProps) {
  const t = useTranslations('adminBillingOps')
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setOpen(next)
        if (!next) onClosed()
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          aria-label={triggerLabel}
        >
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t('ops.close')}
        closeDisabled={busy}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          {done ? (
            <Button
              onClick={() => {
                setOpen(false)
                onClosed()
              }}
            >
              {t('ops.done')}
            </Button>
          ) : (
            footer
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Settles one outcome-unknown send with evidence from Meta. */
export function ResolveSendDialog({
  orgId,
  hold,
  canApply,
  onChanged,
}: {
  orgId: string
  hold: HoldRow
  canApply: boolean
  onChanged: () => void
}) {
  const t = useTranslations('adminBillingOps')
  const ids = { message: useId(), evidence: useId() }
  const [resolution, setResolution] =
    useState<DispatchResolutionChoice>('accepted')
  const [providerMessageId, setProviderMessageId] = useState('')
  const [evidence, setEvidence] = useState('')
  const [reason, setReason] = useState('')
  const operation = useOperation<DispatchResolutionResult>()
  if (hold.dispatchState !== 'outcome_unknown') return null
  const ready =
    reason.trim() && (resolution === 'not_accepted' || providerMessageId.trim())

  function closed() {
    if (operation.result) onChanged()
    operation.reset()
    setProviderMessageId('')
    setEvidence('')
    setReason('')
    setResolution('accepted')
  }

  return (
    <OperationDialog
      trigger={t('ops.resolve.trigger')}
      triggerLabel={t('ops.resolve.triggerLabel', {
        dispatch: hold.dispatchId,
      })}
      title={t('ops.resolve.title')}
      description={t('ops.resolve.description')}
      disabled={!canApply}
      busy={operation.busy}
      done={!!operation.result}
      onClosed={closed}
      footer={
        <Button
          onClick={() =>
            void operation.run(() =>
              resolveDispatch(orgId, hold.dispatchId, {
                resolution,
                providerMessageId: providerMessageId.trim(),
                evidence: evidence.trim(),
                reason: reason.trim(),
              })
            )
          }
          disabled={!ready || operation.busy}
        >
          {operation.busy
            ? t('ops.applying')
            : t(`ops.resolve.confirm.${resolution}`)}
        </Button>
      }
    >
      {operation.result ? (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm">
          {t(`ops.resolve.outcomes.${operation.result.outcome}`)}
          {operation.result.duplicate && ` ${t('ops.alreadyDone')}`}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            <Mono>{hold.dispatchId}</Mono>
          </p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {t('ops.resolve.choice')}
            </legend>
            {(['accepted', 'not_accepted'] as const).map((choice) => (
              <label key={choice} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`resolution-${hold.dispatchId}`}
                  value={choice}
                  checked={resolution === choice}
                  onChange={() => setResolution(choice)}
                  disabled={operation.busy}
                  className="mt-1 size-4 accent-emerald-600"
                />
                <span>
                  <span className="font-medium">
                    {t(`ops.resolve.choices.${choice}`)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {t(`ops.resolve.effects.${choice}`)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {resolution === 'accepted' && (
            <Field
              htmlFor={ids.message}
              label={t('ops.resolve.providerMessageId')}
              help={t('ops.resolve.providerMessageIdHelp')}
            >
              <input
                id={ids.message}
                value={providerMessageId}
                onChange={(event) => setProviderMessageId(event.target.value)}
                maxLength={255}
                required
                disabled={operation.busy}
                aria-describedby={`${ids.message}-help`}
                className={inputClass}
                dir="ltr"
              />
            </Field>
          )}
          <Field
            htmlFor={ids.evidence}
            label={t('ops.evidence')}
            help={t('ops.evidenceHelp')}
          >
            <input
              id={ids.evidence}
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              maxLength={REASON_LIMIT}
              disabled={operation.busy}
              aria-describedby={`${ids.evidence}-help`}
              className={inputClass}
            />
          </Field>
          <ReasonField
            value={reason}
            onChange={setReason}
            disabled={operation.busy}
          />
          <OperationError error={operation.error} />
        </div>
      )}
    </OperationDialog>
  )
}

const INQUIRY_STATUSES = new Set(['failed', 'canceled', 'expired'])

/** Asks Paymob about one purchase using only the identifiers Akeed stored. */
export function InquiryDialog({
  orgId,
  purchase,
  canApply,
  onChanged,
}: {
  orgId: string
  purchase: PurchaseRow
  canApply: boolean
  onChanged: () => void
}) {
  const t = useTranslations('adminBillingOps')
  const [reason, setReason] = useState('')
  const operation = useOperation<InquiryResult>()
  const eligible =
    purchase.status === 'pending' ||
    (purchase.reconciliationRequired && INQUIRY_STATUSES.has(purchase.status))
  if (!eligible) return null

  return (
    <OperationDialog
      trigger={t('ops.inquiry.trigger')}
      triggerLabel={t('ops.inquiry.triggerLabel', {
        reference: purchase.reference,
      })}
      title={t('ops.inquiry.title')}
      description={t('ops.inquiry.description')}
      disabled={!canApply}
      busy={operation.busy}
      done={!!operation.result}
      onClosed={() => {
        if (operation.result) onChanged()
        operation.reset()
        setReason('')
      }}
      footer={
        <Button
          onClick={() =>
            void operation.run(() =>
              reconcilePurchase(orgId, purchase.reference, reason.trim())
            )
          }
          disabled={!reason.trim() || operation.busy}
        >
          {operation.busy ? t('ops.inquiry.asking') : t('ops.inquiry.confirm')}
        </Button>
      }
    >
      {operation.result ? (
        <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm">
          {t(`ops.inquiry.outcomes.${operation.result.outcome}`)}
          {operation.result.purchase && (
            <span className="mt-1 block">
              {t('ops.inquiry.status', {
                status: t(
                  `purchaseStatuses.${operation.result.purchase.status}`
                ),
              })}
            </span>
          )}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            <Mono>{purchase.reference}</Mono>
          </p>
          <ReasonField
            value={reason}
            onChange={setReason}
            disabled={operation.busy}
          />
          <OperationError error={operation.error} />
        </div>
      )}
    </OperationDialog>
  )
}

function minorFromInput(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const [whole, fraction = ''] = value.trim().split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

function majorFromMinor(value: number) {
  return (value / 100).toFixed(2)
}

/**
 * Records refund or chargeback evidence copied from Paymob. It can reverse
 * or reinstate purchased credits, or flag the purchase for review; it can
 * never mark a payment successful.
 */
export function ProviderEvidenceDialog({
  orgId,
  purchase,
  canApply,
  onChanged,
  locale,
}: {
  orgId: string
  purchase: PurchaseRow
  canApply: boolean
  onChanged: () => void
  locale: SupportedLocale
}) {
  const t = useTranslations('adminBillingOps')
  const ids = {
    action: useId(),
    reference: useId(),
    amount: useId(),
    currency: useId(),
    evidence: useId(),
  }
  const [action, setAction] = useState<ProviderAction>('refund')
  const [providerReference, setProviderReference] = useState('')
  const [amount, setAmount] = useState(majorFromMinor(purchase.totalMinor))
  const [currency, setCurrency] = useState(purchase.currency)
  const [evidence, setEvidence] = useState('')
  const [reason, setReason] = useState('')
  const operation = useOperation<ProviderActionResult>()
  if (purchase.status !== 'successful' && purchase.status !== 'refunded')
    return null
  const amountMinor = minorFromInput(amount)
  const ready =
    amountMinor !== null &&
    /^[A-Z]{3}$/.test(currency) &&
    evidence.trim() &&
    reason.trim()

  function closed() {
    if (operation.result) onChanged()
    operation.reset()
    setAction('refund')
    setProviderReference('')
    setAmount(majorFromMinor(purchase.totalMinor))
    setCurrency(purchase.currency)
    setEvidence('')
    setReason('')
  }

  const result = operation.result
  return (
    <OperationDialog
      trigger={t('ops.evidenceAction.trigger')}
      triggerLabel={t('ops.evidenceAction.triggerLabel', {
        reference: purchase.reference,
      })}
      title={t('ops.evidenceAction.title')}
      description={t('ops.evidenceAction.description')}
      disabled={!canApply}
      busy={operation.busy}
      done={!!result}
      onClosed={closed}
      footer={
        <Button
          onClick={() =>
            amountMinor !== null &&
            void operation.run(() =>
              recordProviderAction(orgId, purchase.reference, {
                action,
                providerReference: providerReference.trim() || undefined,
                amountMinor,
                currency,
                evidence: evidence.trim(),
                reason: reason.trim(),
              })
            )
          }
          disabled={!ready || operation.busy}
        >
          {operation.busy ? t('ops.applying') : t('ops.evidenceAction.confirm')}
        </Button>
      }
    >
      {result ? (
        <p
          role="status"
          className={cn(
            'rounded-lg p-3 text-sm',
            result.outcome === 'quarantined'
              ? 'bg-amber-50 text-amber-950'
              : 'bg-emerald-50 text-emerald-950'
          )}
        >
          {t(`ops.evidenceAction.outcomes.${result.outcome}`, {
            quantity: result.reversal
              ? formatSigned(result.reversal.quantity, locale)
              : '',
          })}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            <Mono>{purchase.reference}</Mono>
          </p>
          <Field htmlFor={ids.action} label={t('ops.evidenceAction.action')}>
            <select
              id={ids.action}
              value={action}
              onChange={(event) =>
                setAction(event.target.value as ProviderAction)
              }
              disabled={operation.busy}
              className={inputClass}
            >
              {PROVIDER_ACTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`ops.evidenceAction.actions.${value}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            htmlFor={ids.reference}
            label={t('ops.evidenceAction.providerReference')}
            help={t(
              action === 'refund'
                ? 'ops.evidenceAction.refundReferenceHelp'
                : 'ops.evidenceAction.disputeReferenceHelp'
            )}
          >
            <input
              id={ids.reference}
              value={providerReference}
              onChange={(event) => setProviderReference(event.target.value)}
              maxLength={128}
              disabled={operation.busy}
              aria-describedby={`${ids.reference}-help`}
              className={inputClass}
              dir="ltr"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <Field
              htmlFor={ids.amount}
              label={t(
                action === 'refund'
                  ? 'ops.evidenceAction.refundAmount'
                  : 'ops.evidenceAction.disputeAmount'
              )}
              help={t(
                action === 'refund'
                  ? 'ops.evidenceAction.refundAmountHelp'
                  : 'ops.evidenceAction.disputeAmountHelp'
              )}
            >
              <input
                id={ids.amount}
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={operation.busy}
                aria-invalid={amountMinor === null}
                aria-describedby={`${ids.amount}-help`}
                className={inputClass}
                dir="ltr"
              />
            </Field>
            <Field
              htmlFor={ids.currency}
              label={t('ops.evidenceAction.currency')}
            >
              <input
                id={ids.currency}
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value.toUpperCase())
                }
                maxLength={3}
                disabled={operation.busy}
                aria-invalid={!/^[A-Z]{3}$/.test(currency)}
                className={inputClass}
                dir="ltr"
              />
            </Field>
          </div>
          <Field
            htmlFor={ids.evidence}
            label={t('ops.evidence')}
            help={t('ops.evidenceRequiredHelp')}
          >
            <input
              id={ids.evidence}
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              maxLength={REASON_LIMIT}
              required
              disabled={operation.busy}
              aria-describedby={`${ids.evidence}-help`}
              className={inputClass}
            />
          </Field>
          <ReasonField
            value={reason}
            onChange={setReason}
            disabled={operation.busy}
          />
          <p className="text-xs text-slate-500">
            {t('ops.evidenceAction.notAuthority')}
          </p>
          <OperationError error={operation.error} />
        </div>
      )}
    </OperationDialog>
  )
}
