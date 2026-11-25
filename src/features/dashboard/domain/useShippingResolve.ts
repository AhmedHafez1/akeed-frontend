'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { shippingResolveErrorKey, useResolveShipping } from '../api/shippingApi'

/**
 * "Mark done" for a delivery request or an unreached customer. The skin says
 * how a message is shown (an App Bridge toast, or the standalone notice);
 * nothing open any more is not an error, since the refreshed list shows it.
 */
export function useShippingResolve({
  onDone,
  onError,
}: {
  onDone: (message: string) => void
  onError: (message: string) => void
}) {
  const t = useTranslations('dashboard.shipping')
  const mutation = useResolveShipping()
  const { mutateAsync } = mutation
  const resolve = useCallback(
    async (verificationId: string) => {
      try {
        await mutateAsync(verificationId)
        onDone(t('markedDone'))
      } catch (error) {
        const key = shippingResolveErrorKey(error)
        if (key) onError(t(`resolveErrors.${key}`))
        else onDone(t('markedDone'))
      }
    },
    [mutateAsync, onDone, onError, t]
  )
  return {
    resolve,
    /** The order being marked, so only its button shows progress. */
    pendingId: mutation.isPending ? (mutation.variables ?? null) : null,
  }
}
