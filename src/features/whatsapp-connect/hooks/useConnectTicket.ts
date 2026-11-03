'use client'

import { useEffect, useRef, useState } from 'react'
import {
  apiErrorCode,
  claimConnectTicket,
  type ConnectTicketClaimed,
} from '../api/whatsappConnectApi'

export type ConnectTicketState =
  | { status: 'claiming' }
  /** No ticket in the address: opened directly, or refreshed after use. */
  | { status: 'missing' }
  | { status: 'invalid'; errorCode: string }
  | { status: 'ready'; claim: ConnectTicketClaimed }

const TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/
const MISSING = Symbol('missing ticket')

/**
 * Reads `?ticket=` once and removes it from the address bar before anything
 * else loads, so it is not left in history, shared links, analytics or the
 * Referer of the page that launches Meta's window. It is never written to
 * storage: a refresh shows the "start again" state.
 */
export function takeTicketFromLocation(): string | null {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('ticket')) return null
  const ticket = url.searchParams.get('ticket')
  url.searchParams.delete('ticket')
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`
  )
  return ticket && TICKET_PATTERN.test(ticket) ? ticket : null
}

/** Trades the page's ticket, once, for the signup ticket and launch settings. */
export function useConnectTicket(): ConnectTicketState {
  const [state, setState] = useState<ConnectTicketState>({
    status: 'claiming',
  })
  // One claim per page, even when effects run twice: a second claim of the
  // same ticket would be refused.
  const claim = useRef<Promise<ConnectTicketClaimed> | null>(null)

  useEffect(() => {
    if (!claim.current) {
      const ticket = takeTicketFromLocation()
      claim.current = ticket
        ? claimConnectTicket(ticket)
        : Promise.reject(MISSING)
    }
    let active = true
    claim.current.then(
      (claimed) => {
        if (active) setState({ status: 'ready', claim: claimed })
      },
      (error: unknown) => {
        if (!active) return
        setState(
          error === MISSING
            ? { status: 'missing' }
            : { status: 'invalid', errorCode: apiErrorCode(error) }
        )
      }
    )
    return () => {
      active = false
    }
  }, [])

  return state
}
