import { describe, expect, it } from 'vitest'
import {
  canLaunch,
  initialSignupState,
  readyToSubmit,
  signupReducer,
  type SignupAction,
  type SignupState,
} from './signupMachine'

const hints = {
  wabaIds: ['1'],
  phoneNumberId: '2',
  isOnBusinessApp: false,
}

const run = (...actions: SignupAction[]): SignupState =>
  actions.reduce(signupReducer, initialSignupState)

describe('signupReducer', () => {
  it('is ready to submit with the code first, then the session', () => {
    const state = run(
      { type: 'LAUNCH' },
      { type: 'LOGIN_RESULT', code: 'code-1' },
      { type: 'SESSION_FINISH', hints }
    )
    expect(readyToSubmit(state)).toBe(true)
    expect(state).toMatchObject({ code: 'code-1', session: hints })
  })

  it('is ready to submit with the session first, then the code', () => {
    const state = run(
      { type: 'LAUNCH' },
      { type: 'SESSION_FINISH', hints },
      { type: 'LOGIN_RESULT', code: 'code-1' }
    )
    expect(readyToSubmit(state)).toBe(true)
  })

  it('waits for the session after the code, then goes ahead without it', () => {
    const waiting = run({ type: 'LAUNCH' }, { type: 'LOGIN_RESULT', code: 'c' })
    expect(readyToSubmit(waiting)).toBe(false)
    const after = signupReducer(waiting, { type: 'SESSION_WAIT_OVER' })
    expect(readyToSubmit(after)).toBe(true)
    expect(after.session).toBeNull()
  })

  it('never submits a FINISH without a code', () => {
    const state = run({ type: 'LAUNCH' }, { type: 'SESSION_FINISH', hints })
    expect(readyToSubmit(state)).toBe(false)
    expect(state.phase).toBe('inMeta')
  })

  it('ignores repeated answers', () => {
    const state = run(
      { type: 'LAUNCH' },
      { type: 'LOGIN_RESULT', code: 'first' },
      { type: 'LOGIN_RESULT', code: 'second' },
      { type: 'SESSION_FINISH', hints },
      {
        type: 'SESSION_FINISH',
        hints: { ...hints, phoneNumberId: '9' },
      },
      { type: 'SUBMIT_STARTED' },
      { type: 'SUBMIT_STARTED' },
      { type: 'LAUNCH' }
    )
    expect(state).toMatchObject({
      phase: 'submitting',
      code: 'first',
      session: hints,
    })
  })

  it('treats a closed window with no code as cancelled, and lets the merchant retry', () => {
    const state = run({ type: 'LAUNCH' }, { type: 'LOGIN_RESULT', code: null })
    expect(state.phase).toBe('cancelled')
    expect(canLaunch(state)).toBe(true)
    expect(signupReducer(state, { type: 'RESET' })).toEqual(initialSignupState)
  })

  it('says the last Finish was missed when Meta finished but gave no code', () => {
    expect(
      run(
        { type: 'LAUNCH' },
        { type: 'SESSION_FINISH', hints },
        { type: 'LOGIN_RESULT', code: null }
      ).phase
    ).toBe('noCode')
    // The same, with the session message arriving after the callback.
    expect(
      run(
        { type: 'LAUNCH' },
        { type: 'LOGIN_RESULT', code: null },
        { type: 'SESSION_FINISH', hints }
      ).phase
    ).toBe('noCode')
  })

  it("keeps Meta's error code whichever answer comes first", () => {
    for (const actions of [
      [
        { type: 'SESSION_ERROR', errorCode: '2655093' },
        { type: 'LOGIN_RESULT', code: null },
      ],
      [
        { type: 'LOGIN_RESULT', code: null },
        { type: 'SESSION_ERROR', errorCode: '2655093' },
      ],
    ] as SignupAction[][]) {
      const state = run({ type: 'LAUNCH' }, ...actions)
      expect(state).toMatchObject({
        phase: 'metaError',
        metaErrorCode: '2655093',
      })
      expect(canLaunch(state)).toBe(true)
    }
  })

  it('records the outcome and drops the code', () => {
    const submitting = run(
      { type: 'LAUNCH' },
      { type: 'LOGIN_RESULT', code: 'c' },
      { type: 'SESSION_FINISH', hints },
      { type: 'SUBMIT_STARTED' }
    )
    const connected = signupReducer(submitting, {
      type: 'SUBMIT_SUCCEEDED',
      completion: { displayPhoneNumber: '+20 1', signupPath: 'new_number' },
    })
    expect(connected).toMatchObject({ phase: 'connected', code: null })
    expect(canLaunch(connected)).toBe(false)

    const failed = signupReducer(submitting, {
      type: 'SUBMIT_FAILED',
      errorCode: 'WHATSAPP_NUMBER_ALREADY_CONNECTED',
    })
    expect(failed).toMatchObject({ phase: 'failed', code: null })
    expect(canLaunch(failed)).toBe(false)
    expect(signupReducer(failed, { type: 'RESET' })).toBe(failed)
  })

  it('expires before submitting but never undoes a submission', () => {
    expect(run({ type: 'TICKET_EXPIRED' }).phase).toBe('expired')
    const submitting = run(
      { type: 'LAUNCH' },
      { type: 'LOGIN_RESULT', code: 'c' },
      { type: 'SESSION_WAIT_OVER' },
      { type: 'SUBMIT_STARTED' }
    )
    expect(signupReducer(submitting, { type: 'TICKET_EXPIRED' }).phase).toBe(
      'submitting'
    )
  })
})
