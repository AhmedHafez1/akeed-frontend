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
  useWhatsappSenderData,
} from './useWhatsappSender'

export type WhatsappTabStatus = 'loading' | 'error' | 'ready'

/**
 * Everything the WhatsApp settings tab does, for either skin: the derived
 * view, connecting and disconnecting. Disconnect ignores duplicate clicks
 * and refetches the server's answer whether it succeeds or fails.
 */
export function useWhatsappTab() {
  const data = useWhatsappSenderData(true, true)
  const entry = useWhatsappConnectEntry()
  const disconnect = useDisconnectWhatsapp()
  const [disconnectError, setDisconnectError] = useState<ServerErrorKey | null>(
    null
  )
  // A second click can land before the pending state re-renders.
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
