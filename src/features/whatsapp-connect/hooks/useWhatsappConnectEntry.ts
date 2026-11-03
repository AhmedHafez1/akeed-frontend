'use client'

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { resolveSupportedLocale } from '@/shared/lib/locale'
import {
  apiErrorCode,
  getWhatsappSender,
  issueConnectTicket,
  whatsappSenderQueryKey,
} from '../api/whatsappConnectApi'

export type ConnectEntryStatus =
  | 'idle'
  | 'opening'
  /** The browser blocked the new tab: the link waits for a second click. */
  | 'blocked'
  | 'opened'
  | 'failed'

export interface WhatsappConnectEntry {
  /** The switch, pilot list and owner role all allow connecting. */
  visible: boolean
  status: ConnectEntryStatus
  errorCode: string | null
  /** Only while `blocked`: the connect page link, for a direct click. */
  pendingUrl: string | null
  open: () => void
}

/**
 * The settings action that opens the connect page in a new top-level tab.
 * Shown from the backend's answer alone; there is no frontend switch.
 */
export function useWhatsappConnectEntry(): WhatsappConnectEntry {
  const locale = resolveSupportedLocale(useLocale())
  const availability = useQuery({
    queryKey: whatsappSenderQueryKey,
    queryFn: getWhatsappSender,
    staleTime: 60_000,
    retry: false,
  })
  const [status, setStatus] = useState<ConnectEntryStatus>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  const open = useCallback(() => {
    if (status === 'opening') return
    // Opened inside the click, before the request, or the browser blocks it.
    const tab = window.open('', '_blank')
    if (tab) tab.opener = null
    setStatus('opening')
    setErrorCode(null)
    setPendingUrl(null)
    issueConnectTicket(locale).then(
      ({ connectUrl }) => {
        if (tab && !tab.closed) {
          tab.location.replace(connectUrl)
          setStatus('opened')
        } else {
          setPendingUrl(connectUrl)
          setStatus('blocked')
        }
      },
      (error: unknown) => {
        tab?.close()
        setErrorCode(apiErrorCode(error))
        setStatus('failed')
      }
    )
  }, [locale, status])

  const data = availability.data
  return {
    visible: Boolean(data?.available && data.canConnect),
    status,
    errorCode,
    pendingUrl: status === 'blocked' ? pendingUrl : null,
    open,
  }
}
