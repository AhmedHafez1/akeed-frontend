import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RESEND_COOLDOWN_SECONDS, useResendCooldown } from './useResendCooldown'

describe('useResendCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at 60 seconds when an email was just sent and counts down', () => {
    const send = vi.fn(async () => {})
    const { result } = renderHook(() =>
      useResendCooldown({ send, startCoolingDown: true })
    )

    expect(RESEND_COOLDOWN_SECONDS).toBe(60)
    expect(result.current.secondsLeft).toBe(60)
    expect(result.current.canResend).toBe(false)

    act(() => {
      vi.advanceTimersByTime(18_000)
    })
    expect(result.current.secondsLeft).toBe(42)

    act(() => {
      vi.advanceTimersByTime(42_000)
    })
    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.canResend).toBe(true)
  })

  it('does not send while cooling down', async () => {
    const send = vi.fn(async () => {})
    const { result } = renderHook(() =>
      useResendCooldown({ send, startCoolingDown: true })
    )

    await act(async () => {
      await result.current.resend()
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('sends, reports success and restarts the cooldown', async () => {
    const send = vi.fn(async () => {})
    const { result } = renderHook(() => useResendCooldown({ send }))

    expect(result.current.canResend).toBe(true)
    await act(async () => {
      await result.current.resend()
    })

    expect(send).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('sent')
    expect(result.current.secondsLeft).toBe(60)
    expect(result.current.canResend).toBe(false)
  })

  it('ignores a second click while the first send is in flight', async () => {
    let finish: () => void = () => {}
    const send = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    const { result } = renderHook(() => useResendCooldown({ send }))

    let first: Promise<void> = Promise.resolve()
    act(() => {
      first = result.current.resend()
      void result.current.resend()
    })
    expect(send).toHaveBeenCalledTimes(1)

    await act(async () => {
      finish()
      await first
    })
    expect(result.current.status).toBe('sent')
  })

  it('reports an error and lets the merchant try again', async () => {
    const send = vi.fn(async () => {
      throw new Error('rate limited')
    })
    const { result } = renderHook(() => useResendCooldown({ send }))

    await act(async () => {
      await result.current.resend()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.canResend).toBe(true)
  })
})
