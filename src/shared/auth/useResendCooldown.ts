'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/shared/lib/logger'

export const RESEND_COOLDOWN_SECONDS = 60

export type ResendStatus = 'idle' | 'sending' | 'sent' | 'error'

interface UseResendCooldownOptions {
  send: () => Promise<void>
  /** Start counting at once, because an email was just sent. */
  startCoolingDown?: boolean
  cooldownSeconds?: number
}

export interface ResendCooldown {
  secondsLeft: number
  status: ResendStatus
  canResend: boolean
  resend: () => Promise<void>
}

const logger = createLogger('Auth')

/**
 * A resend action with a visible cooldown. The countdown restarts after each
 * successful send; a failed send leaves the button available again.
 */
export function useResendCooldown({
  send,
  startCoolingDown = false,
  cooldownSeconds = RESEND_COOLDOWN_SECONDS,
}: UseResendCooldownOptions): ResendCooldown {
  // Counted from a deadline, not by decrementing, so a throttled background
  // tab still shows the right number when the merchant comes back.
  const [deadline, setDeadline] = useState<number | null>(() =>
    startCoolingDown ? Date.now() + cooldownSeconds * 1000 : null
  )
  const [secondsLeft, setSecondsLeft] = useState(
    startCoolingDown ? cooldownSeconds : 0
  )
  const [status, setStatus] = useState<ResendStatus>('idle')
  const inFlight = useRef(false)

  useEffect(() => {
    if (deadline === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        window.clearInterval(timer)
        setDeadline(null)
      }
    }
    const timer = window.setInterval(tick, 1000)
    tick()
    return () => window.clearInterval(timer)
  }, [deadline])

  const resend = useCallback(async () => {
    if (inFlight.current || secondsLeft > 0) return
    inFlight.current = true
    setStatus('sending')
    try {
      await send()
      setStatus('sent')
      setSecondsLeft(cooldownSeconds)
      setDeadline(Date.now() + cooldownSeconds * 1000)
    } catch (error) {
      logger.error('Resend failed', error)
      setStatus('error')
    } finally {
      inFlight.current = false
    }
  }, [cooldownSeconds, secondsLeft, send])

  return {
    secondsLeft,
    status,
    canResend: secondsLeft === 0 && status !== 'sending',
    resend,
  }
}
