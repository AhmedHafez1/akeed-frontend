'use client'

import { useCallback, useRef, useState } from 'react'
import {
  apiErrorCode,
  type WhatsappDisconnectResult,
} from '../api/whatsappConnectApi'
import { serverErrorKey, type ServerErrorKey } from '../model/signupErrors'
import {
  whatsappTabView,
  type WhatsappTabView,
} from '../model/whatsappTabState'
import { useWhatsappConnectEntry } from './useWhatsappConnectEntry'
import {
  useDisconnectWhatsapp,
  useUpdateWhatsappThankYou,
  useWhatsappSenderData,
} from './useWhatsappSender'

export type WhatsappTabStatus = 'loading' | 'error' | 'ready'

/**
 * Everything the WhatsApp settings tab does, for either skin: the derived
 * view, connecting, the thank-you switch and disconnecting. Each mutation
 * ignores a second submission while the first is in flight, and both
 * refetch the server's answer whether they succeed or fail.
 */
export function useWhatsappTab() {
  const data = useWhatsappSenderData()
  const entry = useWhatsappConnectEntry()
  const thankYou = useUpdateWhatsappThankYou()
  const disconnect = useDisconnectWhatsapp()
  const [thankYouError, setThankYouError] = useState<ServerErrorKey | null>(
    null
  )
  const [disconnectError, setDisconnectError] = useState<ServerErrorKey | null>(
    null
  )
  // A second click can land before the pending state re-renders.
  const thankYouInFlight = useRef(false)
  const disconnectInFlight = useRef(false)
  const [disconnected, setDisconnected] =
    useState<WhatsappDisconnectResult | null>(null)

  const status: WhatsappTabStatus = data.isLoading
    ? 'loading'
    : data.isError
      ? 'error'
      : 'ready'
  const view: WhatsappTabView =
    status === 'ready'
      ? whatsappTabView(data.availability, data.connection)
      : { kind: 'hidden' }

  const setThankYou = useCallback(
    (enabled: boolean) => {
      if (thankYouInFlight.current) return
      thankYouInFlight.current = true
      setThankYouError(null)
      thankYou.mutate(enabled, {
        onError: (error) =>
          setThankYouError(serverErrorKey(apiErrorCode(error))),
        onSettled: () => {
          thankYouInFlight.current = false
        },
      })
    },
    [thankYou]
  )

  const runDisconnect = useCallback(async (): Promise<boolean> => {
    if (disconnectInFlight.current) return false
    disconnectInFlight.current = true
    setDisconnectError(null)
    try {
      setDisconnected(await disconnect.mutateAsync())
      return true
    } catch (error) {
      setDisconnectError(serverErrorKey(apiErrorCode(error)))
      return false
    } finally {
      disconnectInFlight.current = false
    }
  }, [disconnect])

  return {
    status,
    view,
    retry: data.retry,
    entry,
    thankYou: {
      set: setThankYou,
      isSaving: thankYou.isPending,
      /** Under `whatsappConnect.errors`; null when nothing failed. */
      error: thankYouError,
    },
    disconnect: {
      run: runDisconnect,
      isPending: disconnect.isPending,
      /** Under `whatsappConnect.errors`; null when nothing failed. */
      error: disconnectError,
      clearError: () => setDisconnectError(null),
      /** What the last disconnect left to do in the Business app. */
      result: disconnected,
    },
  }
}

export type WhatsappTabModel = ReturnType<typeof useWhatsappTab>
