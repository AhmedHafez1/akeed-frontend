'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isValidPhoneNumber } from '@/shared/ui/international-phone-input'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import {
  createManualOrder,
  isManualOrderApiError,
  type ManualOrderCreateInput,
} from '../api/manualOrderApi'
import {
  isManualOrderCurrency,
  type ManualOrderFeedback,
  type ManualOrderFormValues,
  type ManualOrderRecoveryMode,
  type ManualOrderResult,
} from './manualOrder.model'

const SUBMISSION_TIMEOUT_MS = 30_000
const fieldOrder: Array<keyof ManualOrderFormValues> = [
  'customerPhone',
  'customerName',
  'orderNumber',
  'totalPrice',
  'currency',
  'paymentMethod',
]

const logger = createLogger('ManualOrder')

function createSubmissionToken(): string {
  return crypto.randomUUID()
}

function toPayload(values: ManualOrderFormValues): ManualOrderCreateInput {
  const customerName = values.customerName.trim()
  const orderNumber = values.orderNumber.trim()

  return {
    customerPhone: values.customerPhone.trim(),
    ...(customerName ? { customerName } : {}),
    ...(orderNumber ? { orderNumber } : {}),
    totalPrice: values.totalPrice.trim(),
    currency: values.currency,
    paymentMethod: values.paymentMethod,
  }
}

export function useManualOrderEntry(
  defaultCurrency?: string,
  focusCustomerPhone?: () => void
) {
  const t = useTranslations('manualOrder')
  const schema = useMemo(
    () =>
      z.object({
        customerPhone: z
          .string()
          .min(1, t('validation.customerPhoneRequired'))
          .refine(
            (value) => !value || isValidPhoneNumber(value),
            t('validation.customerPhoneInvalid')
          ),
        customerName: z.string().max(255, t('validation.customerNameTooLong')),
        orderNumber: z.string().max(100, t('validation.orderNumberTooLong')),
        totalPrice: z
          .string()
          .min(1, t('validation.totalPriceRequired'))
          .regex(
            /^(?=.{1,13}$)(?!0+(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/,
            t('validation.totalPriceInvalid')
          ),
        currency: z
          .string()
          .refine(isManualOrderCurrency, t('validation.currencyRequired')),
        paymentMethod: z.literal('cash_on_delivery'),
      }),
    [t]
  )

  const form = useForm<ManualOrderFormValues>({
    resolver: zodResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      customerPhone: '',
      customerName: '',
      orderNumber: '',
      totalPrice: '',
      currency: isManualOrderCurrency(defaultCurrency) ? defaultCurrency : '',
      paymentMethod: 'cash_on_delivery',
    },
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<ManualOrderFeedback | null>(null)
  const [result, setResult] = useState<ManualOrderResult | null>(null)
  const [recoveryMode, setRecoveryMode] =
    useState<ManualOrderRecoveryMode>(null)
  const [isConfirmingStartOver, setIsConfirmingStartOver] = useState(false)
  const submissionTokenRef = useRef<string | null>(null)
  const submittedPayloadRef = useRef<ManualOrderCreateInput | null>(null)
  const requestInFlightRef = useRef(false)

  useEffect(() => {
    if (
      isManualOrderCurrency(defaultCurrency) &&
      !form.formState.dirtyFields.currency &&
      !result &&
      recoveryMode === null
    ) {
      form.setValue('currency', defaultCurrency)
    }
  }, [defaultCurrency, form, recoveryMode, result])

  const resetFlow = useCallback(() => {
    form.reset({
      customerPhone: '',
      customerName: '',
      orderNumber: '',
      totalPrice: '',
      currency: isManualOrderCurrency(defaultCurrency) ? defaultCurrency : '',
      paymentMethod: 'cash_on_delivery',
    })
    submissionTokenRef.current = null
    submittedPayloadRef.current = null
    setFeedback(null)
    setResult(null)
    setRecoveryMode(null)
    setIsConfirmingStartOver(false)
  }, [defaultCurrency, form])

  const focusFirstServerError = useCallback(
    (fieldErrors: Record<string, string>) => {
      const firstField = fieldOrder.find((field) => field in fieldErrors)
      if (firstField) {
        queueMicrotask(() => {
          if (firstField === 'customerPhone' && focusCustomerPhone) {
            focusCustomerPhone()
          } else {
            form.setFocus(firstField)
          }
        })
      }
    },
    [focusCustomerPhone, form]
  )

  const applyServerFieldErrors = useCallback(
    (fieldErrors: Record<string, string>) => {
      for (const field of fieldOrder) {
        if (field in fieldErrors) {
          form.setError(field, {
            type: 'server',
            message: t(`validation.${field}Server`),
          })
        }
      }
      focusFirstServerError(fieldErrors)
    },
    [focusFirstServerError, form, t]
  )

  const submitPayload = useCallback(
    async (payload: ManualOrderCreateInput, token: string) => {
      if (requestInFlightRef.current) return

      requestInFlightRef.current = true
      setIsSubmitting(true)
      setFeedback(null)
      setIsConfirmingStartOver(false)
      form.clearErrors()

      const controller = new AbortController()
      let didTimeout = false
      const timeoutId = window.setTimeout(() => {
        didTimeout = true
        controller.abort()
      }, SUBMISSION_TIMEOUT_MS)

      try {
        const response = await createManualOrder(
          payload,
          token,
          controller.signal
        )
        setResult(response)
        setRecoveryMode(null)
      } catch (error) {
        logger.error('Submission failed', error)

        if (didTimeout) {
          setFeedback({ tone: 'warning', message: t('errors.timeout') })
          setRecoveryMode('retry')
          return
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setFeedback({ tone: 'warning', message: t('errors.offline') })
          setRecoveryMode('retry')
          return
        }

        if (isManualOrderApiError(error)) {
          if (
            error.code === 'MANUAL_ORDER_VALIDATION_FAILED' &&
            error.fieldErrors
          ) {
            applyServerFieldErrors(error.fieldErrors)
            setFeedback({
              tone: 'critical',
              message: t('errors.validation'),
            })
            setRecoveryMode(null)
            return
          }

          if (error.code === 'MANUAL_ORDER_ACCEPTANCE_FAILED') {
            setFeedback({
              tone: 'warning',
              message: t('errors.acceptanceFailed'),
            })
            setRecoveryMode('retry')
            return
          }

          if (error.code === 'MANUAL_ORDER_IDEMPOTENCY_CONFLICT') {
            setFeedback({ tone: 'critical', message: t('errors.conflict') })
            setRecoveryMode('conflict')
            return
          }

          const errorKeys: Record<string, string> = {
            MANUAL_ORDER_IDEMPOTENCY_KEY_REQUIRED: 'idempotency',
            MANUAL_ORDER_ROLE_REQUIRED: 'role',
            MANUAL_ORDER_SOURCE_UNAVAILABLE: 'sourceUnavailable',
            MANUAL_ORDER_SOURCE_AMBIGUOUS: 'sourceAmbiguous',
            MANUAL_ORDER_SOURCE_UNSUPPORTED: 'sourceUnsupported',
            MANUAL_ORDER_SETUP_INCOMPLETE: 'setupIncomplete',
            MANUAL_ORDER_ENTITLEMENT_REQUIRED: 'entitlement',
          }
          const errorKey = error.code ? errorKeys[error.code] : undefined
          setFeedback({
            tone: 'critical',
            message: errorKey
              ? t(`errors.${errorKey}`)
              : t('errors.unexpected'),
          })
          setRecoveryMode(error.status >= 500 ? 'retry' : null)
          return
        }

        if (error instanceof ApiError) {
          setFeedback({ tone: 'critical', message: t('errors.unexpected') })
          setRecoveryMode(null)
          return
        }

        if (
          error instanceof TypeError ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          setFeedback({ tone: 'warning', message: t('errors.network') })
          setRecoveryMode('retry')
          return
        }

        setFeedback({ tone: 'critical', message: t('errors.unexpected') })
        setRecoveryMode(null)
      } finally {
        window.clearTimeout(timeoutId)
        requestInFlightRef.current = false
        setIsSubmitting(false)
      }
    },
    [applyServerFieldErrors, form, t]
  )

  const submit = form.handleSubmit(
    async (values) => {
      const payload = toPayload(values)
      const token = submissionTokenRef.current ?? createSubmissionToken()
      submissionTokenRef.current = token
      submittedPayloadRef.current = payload
      await submitPayload(payload, token)
    },
    (validationErrors) => {
      const firstField = fieldOrder.find(
        (field) => validationErrors[field] !== undefined
      )
      if (firstField) {
        queueMicrotask(() => {
          if (firstField === 'customerPhone' && focusCustomerPhone) {
            focusCustomerPhone()
          } else {
            form.setFocus(firstField)
          }
        })
      }
    }
  )

  const retry = useCallback(async () => {
    const payload = submittedPayloadRef.current
    const token = submissionTokenRef.current
    if (!payload || !token) return
    await submitPayload(payload, token)
  }, [submitPayload])

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) return
      if (!nextOpen && result) resetFlow()
      setIsOpen(nextOpen)
    },
    [isSubmitting, resetFlow, result]
  )

  return {
    form,
    isOpen,
    isSubmitting,
    isLocked: recoveryMode !== null,
    recoveryMode,
    feedback,
    result,
    isConfirmingStartOver,
    setIsConfirmingStartOver,
    onOpenChange,
    submit,
    retry,
    resetFlow,
  }
}
