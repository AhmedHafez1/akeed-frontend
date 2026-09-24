'use client'

import { useCallback, useState } from 'react'
import { createLogger } from '@/shared/lib/logger'
import { useConfirmVerificationMutation } from '../api/verificationMutations'

const logger = createLogger('ManualConfirmation')

export interface ManualConfirmationTarget {
  verificationId: string
  /** How the order is named in the dialog and the result, e.g. `#1138`. */
  orderLabel: string
}

export type ManualConfirmationFeedback =
  | { tone: 'success'; orderLabel: string }
  | { tone: 'critical' }

/**
 * The "تأكيد يدوي" flow: ask first, then confirm through the server.
 *
 * Confirming tags the order in Shopify, so it always goes through a dialog.
 * The dashboard card and the confirmations table share this hook so both say
 * the same thing and neither can confirm twice at once.
 */
export function useManualConfirmation() {
  const { mutateAsync, isPending } = useConfirmVerificationMutation()
  const [target, setTarget] = useState<ManualConfirmationTarget | null>(null)
  const [feedback, setFeedback] = useState<ManualConfirmationFeedback | null>(
    null
  )

  const request = useCallback((next: ManualConfirmationTarget) => {
    setFeedback(null)
    setTarget(next)
  }, [])

  const dismiss = useCallback(() => {
    if (!isPending) setTarget(null)
  }, [isPending])

  const confirm = useCallback(async () => {
    if (!target || isPending) return
    try {
      await mutateAsync(target.verificationId)
      setFeedback({ tone: 'success', orderLabel: target.orderLabel })
      setTarget(null)
    } catch (error) {
      logger.warn('Failed to confirm order manually', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      setFeedback({ tone: 'critical' })
    }
  }, [isPending, mutateAsync, target])

  const dismissFeedback = useCallback(() => setFeedback(null), [])

  return {
    target,
    isConfirming: isPending,
    feedback,
    request,
    dismiss,
    confirm,
    dismissFeedback,
  }
}
