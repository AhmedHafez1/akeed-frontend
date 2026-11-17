'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  apiErrorCode,
  completeWhatsappSignup,
  type ConnectTicketClaimed,
} from '../api/whatsappConnectApi'
import {
  canLaunch,
  initialSignupState,
  readyToSubmit,
  signupReducer,
  type SignupState,
} from '../model/signupMachine'
import {
  isTrustedFacebookOrigin,
  parseSignupMessage,
} from '../model/signupMessage'
import {
  loadFacebookSdk,
  type FacebookLoginResponse,
  type FacebookSdk,
} from './facebookSdk'

/**
 * How long to wait for the session message once the code is in. Meta's code
 * lives 30 seconds, so this stays well inside it; without the message the
 * server resolves the account from the token alone, or refuses.
 */
export const SESSION_WAIT_MS = 4_000

const MAX_CODE_LENGTH = 2_048

/**
 * An attempt this long that ends with no code and no cancel from Meta most
 * likely ran to the end in a phone tab that lost its link to this page.
 */
export const LOST_ON_TOUCH_MS = 20_000

function isTouchDevice(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

export type SdkStatus = 'loading' | 'ready' | 'failed'

export interface EmbeddedSignup {
  state: SignupState
  sdkStatus: SdkStatus
  canLaunch: boolean
  /** Opens Meta's window. Call it directly from the click. */
  launch: () => void
  /**
   * The last attempt ended with no code on a phone after running long enough
   * to finish: Meta's tab could not report back to this page.
   */
  lostOnTouch: boolean
  /** Back to the start after a cancel or a Meta error. */
  reset: () => void
  retrySdk: () => void
}

function codeFrom(response: FacebookLoginResponse | undefined): string | null {
  const code = response?.authResponse?.code
  return typeof code === 'string' &&
    code.length > 0 &&
    code.length <= MAX_CODE_LENGTH
    ? code
    : null
}

/**
 * Runs Embedded Signup for one claimed ticket: loads the SDK, listens for
 * Meta's session messages, and submits the code exactly once.
 */
export function useEmbeddedSignup(
  claim: ConnectTicketClaimed,
  locale: string
): EmbeddedSignup {
  const [state, dispatch] = useReducer(signupReducer, initialSignupState)
  const [sdkStatus, setSdkStatus] = useState<SdkStatus>('loading')
  const [sdkAttempt, setSdkAttempt] = useState(0)
  const sdk = useRef<FacebookSdk | null>(null)
  const mounted = useRef(true)
  const submitted = useRef(false)
  const launchedAt = useRef(0)
  const sawCancel = useRef(false)
  const [lostOnTouch, setLostOnTouch] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadFacebookSdk(claim.appId, claim.graphApiVersion, locale).then(
      (loaded) => {
        if (!active) return
        sdk.current = loaded
        setSdkStatus('ready')
      },
      () => {
        if (active) setSdkStatus('failed')
      }
    )
    return () => {
      active = false
    }
  }, [claim.appId, claim.graphApiVersion, locale, sdkAttempt])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedFacebookOrigin(event.origin)) return
      const message = parseSignupMessage(event.data)
      if (!message) return
      if (message.kind === 'finish')
        dispatch({ type: 'SESSION_FINISH', hints: message.hints })
      else if (message.kind === 'cancel') {
        sawCancel.current = true
        dispatch({ type: 'SESSION_CANCEL' })
      } else dispatch({ type: 'SESSION_ERROR', errorCode: message.errorCode })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // The signup ticket's own deadline.
  useEffect(() => {
    const remaining = new Date(claim.expiresAt).getTime() - Date.now()
    const timer = window.setTimeout(
      () => dispatch({ type: 'TICKET_EXPIRED' }),
      Math.max(remaining, 0)
    )
    return () => window.clearTimeout(timer)
  }, [claim.expiresAt])

  const waitingForSession =
    state.phase === 'inMeta' && state.code !== null && state.session === null
  useEffect(() => {
    if (!waitingForSession) return
    const timer = window.setTimeout(
      () => dispatch({ type: 'SESSION_WAIT_OVER' }),
      SESSION_WAIT_MS
    )
    return () => window.clearTimeout(timer)
  }, [waitingForSession])

  // The one completion request: the signup ticket is single use.
  const shouldSubmit = readyToSubmit(state)
  useEffect(() => {
    if (!shouldSubmit || submitted.current || state.code === null) return
    submitted.current = true
    dispatch({ type: 'SUBMIT_STARTED' })
    completeWhatsappSignup({
      signupTicket: claim.signupTicket,
      code: state.code,
      session: state.session,
    }).then(
      (result) => {
        if (mounted.current)
          dispatch({
            type: 'SUBMIT_SUCCEEDED',
            completion: {
              displayPhoneNumber: result.displayPhoneNumber,
              signupPath: result.signupPath,
            },
          })
      },
      (error: unknown) => {
        if (mounted.current)
          dispatch({ type: 'SUBMIT_FAILED', errorCode: apiErrorCode(error) })
      }
    )
  }, [shouldSubmit, state.code, state.session, claim.signupTicket])

  const launchable = canLaunch(state) && sdkStatus === 'ready'

  const launch = useCallback(() => {
    const loaded = sdk.current
    if (!loaded || !launchable || submitted.current) return
    dispatch({ type: 'LAUNCH' })
    launchedAt.current = Date.now()
    sawCancel.current = false
    setLostOnTouch(false)
    // FB.login opens a popup, so it runs inside the click, before any await.
    loaded.login(
      (response) => {
        if (!mounted.current) return
        const code = codeFrom(response)
        if (
          code === null &&
          !sawCancel.current &&
          Date.now() - launchedAt.current >= LOST_ON_TOUCH_MS &&
          isTouchDevice()
        )
          setLostOnTouch(true)
        dispatch({ type: 'LOGIN_RESULT', code })
      },
      {
        config_id: claim.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, version: 'v5' },
      }
    )
  }, [claim.configId, launchable])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const retrySdk = useCallback(() => {
    setSdkStatus('loading')
    setSdkAttempt((attempt) => attempt + 1)
  }, [])

  return {
    state,
    sdkStatus,
    canLaunch: launchable,
    launch,
    lostOnTouch,
    reset,
    retrySdk,
  }
}
