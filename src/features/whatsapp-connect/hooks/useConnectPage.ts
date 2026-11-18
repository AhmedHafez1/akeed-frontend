'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SupportedLocale } from '@/shared/lib/locale'
import {
  apiErrorCode,
  claimConnectTicket,
  completeWhatsappSignup,
  relaunchWhatsappSignup,
  type ConnectTicketClaimed,
  type SignupCompletion,
} from '../api/whatsappConnectApi'
import { leavePage } from './leavePage'
import {
  readSignupReturn,
  withoutSignupReturn,
  type SignupReturn,
} from '../model/signupReturn'

export type ConnectPageState =
  | { status: 'claiming' }
  /** No ticket in the address: opened directly, or refreshed after use. */
  | { status: 'missing' }
  /** The link or Meta's return could not be used. */
  | { status: 'invalid'; errorCode: string }
  /** Ready to go to Meta. `leaving` once the tab is on its way. */
  | { status: 'ready'; claim: ConnectTicketClaimed; leaving: boolean }
  /** Back from Meta without a code: can go again with the same ticket. */
  | {
      status: 'returned'
      signupTicket: string
      cancelled: boolean
      metaErrorCode: string | null
      leaving: boolean
    }
  /** Back from Meta with a code; the server is checking it. */
  | { status: 'submitting' }
  | { status: 'connected'; completion: SignupCompletion }
  /** The server refused, or the request failed. Needs a new link. */
  | { status: 'failed'; errorCode: string }
  /** The page's ticket ran out. Needs a new link. */
  | { status: 'expired' }

export interface ConnectPage {
  state: ConnectPageState
  /** Sends this tab to Meta's signup. Only while `ready` or `returned`. */
  goToMeta: () => void
}

const TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/

type Arrival =
  | { kind: 'ticket'; ticket: string }
  | { kind: 'return'; signupReturn: SignupReturn }
  | { kind: 'none' }

/**
 * Reads what the page arrived with (a link ticket, or Meta's return) and
 * removes it from the address before anything else, so a refresh, a shared
 * link or a later request never repeats it. Nothing is written to storage.
 */
export function takeArrival(): Arrival {
  const url = new URL(window.location.href)
  const ticket = url.searchParams.get('ticket')
  const signupReturn = readSignupReturn(url.searchParams)
  const clean = new URL(url.href)
  clean.searchParams.delete('ticket')
  const rest = withoutSignupReturn(clean)
  const path = rest ?? `${clean.pathname}${clean.search}${clean.hash}`
  if (path !== `${url.pathname}${url.search}${url.hash}`)
    window.history.replaceState(window.history.state, '', path)

  if (signupReturn) return { kind: 'return', signupReturn }
  if (ticket !== null)
    return TICKET_PATTERN.test(ticket)
      ? { kind: 'ticket', ticket }
      : { kind: 'none' }
  return { kind: 'none' }
}

/**
 * The connect page from link to result, in one tab. A link ticket is traded
 * for a signup ticket and Meta's sign-in link; the tab goes to Meta, and
 * Meta brings it back here with a code (sent once to the server) or without
 * one (another try trades the unused ticket for a fresh link). Because no
 * second tab waits, a phone browser that reloads or drops this tab while
 * Meta is open loses nothing.
 */
export function useConnectPage(locale: SupportedLocale): ConnectPage {
  const [state, setState] = useState<ConnectPageState>({ status: 'claiming' })
  // One arrival per page, even when effects run twice: a second claim or
  // completion with the same ticket would be refused.
  const started = useRef<Promise<ConnectPageState> | null>(null)
  const withCode = useRef(false)

  useEffect(() => {
    if (!started.current) {
      const arrival = takeArrival()
      withCode.current =
        arrival.kind === 'return' && arrival.signupReturn.kind === 'code'
      started.current = arrive(arrival, locale)
    }
    let active = true
    queueMicrotask(() => {
      if (active && withCode.current)
        setState((current) =>
          current.status === 'claiming' ? { status: 'submitting' } : current
        )
    })
    started.current.then((next) => {
      if (active) setState(next)
    })
    return () => {
      active = false
    }
  }, [locale])

  // The signup ticket's own deadline, while the page waits for a click.
  const expiresAt = state.status === 'ready' ? state.claim.expiresAt : null
  useEffect(() => {
    if (!expiresAt) return
    const timer = window.setTimeout(
      () =>
        setState((current) =>
          current.status === 'ready' && !current.leaving
            ? { status: 'expired' }
            : current
        ),
      Math.max(new Date(expiresAt).getTime() - Date.now(), 0)
    )
    return () => window.clearTimeout(timer)
  }, [expiresAt])

  const goToMeta = useCallback(() => {
    if (state.status === 'ready' && !state.leaving) {
      setState({ ...state, leaving: true })
      leavePage(state.claim.signupUrl)
      return
    }
    if (state.status !== 'returned' || state.leaving) return
    setState({ ...state, leaving: true })
    relaunchWhatsappSignup(state.signupTicket, locale).then(
      (claim) => leavePage(claim.signupUrl),
      (error: unknown) =>
        setState({ status: 'failed', errorCode: apiErrorCode(error) })
    )
  }, [state, locale])

  return { state, goToMeta }
}

async function arrive(
  arrival: Arrival,
  locale: SupportedLocale
): Promise<ConnectPageState> {
  if (arrival.kind === 'none') return { status: 'missing' }
  try {
    if (arrival.kind === 'ticket') {
      const claim = await claimConnectTicket(arrival.ticket, locale)
      return { status: 'ready', claim, leaving: false }
    }
    const back = arrival.signupReturn
    if (back.kind === 'invalid')
      return { status: 'invalid', errorCode: 'WHATSAPP_CONNECT_TICKET_INVALID' }
    if (back.kind === 'error')
      return {
        status: 'returned',
        signupTicket: back.signupTicket,
        cancelled: back.cancelled,
        metaErrorCode: back.metaErrorCode,
        leaving: false,
      }
    const result = await completeWhatsappSignup({
      signupTicket: back.signupTicket,
      code: back.code,
      redirectLocale: locale,
    })
    return {
      status: 'connected',
      completion: {
        displayPhoneNumber: result.displayPhoneNumber,
        signupPath: result.signupPath,
      },
    }
  } catch (error) {
    const errorCode = apiErrorCode(error)
    return arrival.kind === 'ticket'
      ? { status: 'invalid', errorCode }
      : { status: 'failed', errorCode }
  }
}
