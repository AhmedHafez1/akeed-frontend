import type { SignupSessionHints } from './signupMessage'

/**
 * One Embedded Signup attempt.
 *
 * Meta answers twice and in no fixed order: the login callback with the code,
 * and a session message with the chosen account and number. The attempt
 * submits once it holds the code and either the session message or the end
 * of a short wait for it. Duplicate answers change nothing, and nothing
 * counts as connected until the server has verified and saved it.
 */
export type SignupPhase =
  /** Ready to open Meta's window. */
  | 'idle'
  /** Meta's window is open. */
  | 'inMeta'
  /** The code and session are in; the server is checking them. */
  | 'submitting'
  | 'connected'
  /** Closed or cancelled in Meta's window. Can start again. */
  | 'cancelled'
  /** Meta's window reported an error. Can start again. */
  | 'metaError'
  /** Finished in Meta's window but closed before the last Finish. Can start again. */
  | 'noCode'
  /** The server refused, or the request failed. Needs a new link. */
  | 'failed'
  /** The page's ticket ran out. Needs a new link. */
  | 'expired'

export interface SignupCompletion {
  displayPhoneNumber: string | null
  signupPath: 'coexistence' | 'new_number'
}

export interface SignupState {
  phase: SignupPhase
  /** Set once per attempt; held until the one submission. */
  code: string | null
  session: SignupSessionHints | null
  /** Meta finished the flow, whether or not a code followed. */
  finished: boolean
  /** The wait for a session message after the code is over. */
  sessionWaitOver: boolean
  /** Meta's signup error code, for guidance. */
  metaErrorCode: string | null
  /** The server's error code, or `NETWORK`. */
  errorCode: string | null
  completion: SignupCompletion | null
}

export type SignupAction =
  | { type: 'LAUNCH' }
  | { type: 'LOGIN_RESULT'; code: string | null }
  | { type: 'SESSION_FINISH'; hints: SignupSessionHints }
  | { type: 'SESSION_CANCEL' }
  | { type: 'SESSION_ERROR'; errorCode: string | null }
  | { type: 'SESSION_WAIT_OVER' }
  | { type: 'SUBMIT_STARTED' }
  | { type: 'SUBMIT_SUCCEEDED'; completion: SignupCompletion }
  | { type: 'SUBMIT_FAILED'; errorCode: string }
  | { type: 'TICKET_EXPIRED' }
  | { type: 'RESET' }

export const initialSignupState: SignupState = {
  phase: 'idle',
  code: null,
  session: null,
  finished: false,
  sessionWaitOver: false,
  metaErrorCode: null,
  errorCode: null,
  completion: null,
}

const RETRYABLE: ReadonlySet<SignupPhase> = new Set([
  'idle',
  'cancelled',
  'metaError',
  'noCode',
])

/** Whether the merchant may open Meta's window (again) on this page. */
export function canLaunch(state: SignupState): boolean {
  return RETRYABLE.has(state.phase)
}

/** Whether the attempt holds everything to submit, and has not yet. */
export function readyToSubmit(state: SignupState): boolean {
  return (
    state.phase === 'inMeta' &&
    state.code !== null &&
    (state.session !== null || state.sessionWaitOver)
  )
}

export function signupReducer(
  state: SignupState,
  action: SignupAction
): SignupState {
  switch (action.type) {
    case 'LAUNCH':
      return canLaunch(state)
        ? { ...initialSignupState, phase: 'inMeta' }
        : state

    case 'LOGIN_RESULT':
      if (state.phase !== 'inMeta' || state.code !== null) return state
      if (action.code) return { ...state, code: action.code }
      // No code: closed, cancelled, failed, or closed on the last screen.
      if (state.metaErrorCode !== null) return { ...state, phase: 'metaError' }
      return { ...state, phase: state.finished ? 'noCode' : 'cancelled' }

    case 'SESSION_FINISH':
      if (state.session !== null) return state
      if (state.phase === 'inMeta')
        return { ...state, session: action.hints, finished: true }
      // A late finish after the callback said "no code".
      if (state.phase === 'cancelled')
        return { ...state, finished: true, phase: 'noCode' }
      return state

    case 'SESSION_CANCEL':
      return state

    case 'SESSION_ERROR':
      if (state.phase === 'inMeta' && state.code === null)
        return { ...state, metaErrorCode: action.errorCode }
      // The callback came first and reported no code.
      if (state.phase === 'cancelled' || state.phase === 'metaError')
        return {
          ...state,
          phase: 'metaError',
          metaErrorCode: action.errorCode,
        }
      return state

    case 'SESSION_WAIT_OVER':
      return state.phase === 'inMeta' && state.code !== null
        ? { ...state, sessionWaitOver: true }
        : state

    case 'SUBMIT_STARTED':
      return readyToSubmit(state) ? { ...state, phase: 'submitting' } : state

    case 'SUBMIT_SUCCEEDED':
      return state.phase === 'submitting'
        ? {
            ...state,
            phase: 'connected',
            code: null,
            completion: action.completion,
          }
        : state

    case 'SUBMIT_FAILED':
      return state.phase === 'submitting'
        ? { ...state, phase: 'failed', code: null, errorCode: action.errorCode }
        : state

    case 'TICKET_EXPIRED':
      return state.phase === 'connected' || state.phase === 'submitting'
        ? state
        : { ...state, phase: 'expired', code: null }

    case 'RESET':
      return canLaunch(state) ? initialSignupState : state
  }
}
