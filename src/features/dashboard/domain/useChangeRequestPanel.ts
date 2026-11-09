'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatDayAndClock, formatUpdatedAt } from '../lib/orderDisplay'
import { customerContact, type CustomerContact } from '../lib/customerContact'
import type { ChangeRequestSummary } from '../model/dashboard.model'
import {
  changeRequestAckView,
  isResendBusy,
  resendView,
  type ChangeRequestAckView,
  type ResendView,
} from './changeRequestView'
import {
  useChangeRequestActions,
  type ChangeRequestAction,
  type ChangeRequestActionResult,
} from './useChangeRequestActions'

export interface ChangeRequestFeedback {
  tone: 'success' | 'info' | 'critical'
  text: string
}

export interface ChangeRequestPanelModel {
  /** When the customer asked, as the dashboard writes a recent time. */
  age: string
  ack: ChangeRequestAckView
  contact: CustomerContact | null
  resend: ResendView
  /** The panel's one line for a resend in flight or refused, if any. */
  resendText: string | null
  canAct: boolean
  pending: ChangeRequestAction | null
  /** Confirm, cancel and resend are off while one runs or a resend waits. */
  disabled: { confirm: boolean; cancel: boolean; resend: boolean }
  run: (action: ChangeRequestAction) => Promise<ChangeRequestFeedback | null>
}

/**
 * One change request as both skins' panels show it: the age, whether the
 * customer was told, the contact links, where an updated confirmation stands,
 * and the three outcomes, each answered with one line of feedback. A refusal
 * because the request was settled first reads as what won ("Already
 * confirmed by the customer."), after the lists were refreshed.
 */
export function useChangeRequestPanel({
  verificationId,
  summary,
  phone,
  timeZone,
  canAct,
}: {
  verificationId: string
  summary: ChangeRequestSummary
  phone: string | null | undefined
  timeZone: string
  canAct: boolean
}): ChangeRequestPanelModel {
  const t = useTranslations('dashboard.changeRequest')
  const { locale } = useLocaleInfo()
  const { pending, run } = useChangeRequestActions()
  const resend = resendView(summary)
  const busy = pending !== null

  const resendText =
    resend.kind === 'queued'
      ? t('resendState.queued')
      : resend.kind === 'scheduled'
        ? t('resendState.scheduled', {
            time: formatDayAndClock(resend.at, locale, timeZone),
          })
        : resend.kind === 'failed'
          ? t(`resendState.${resend.reason}`)
          : null

  const feedbackOf = (
    result: ChangeRequestActionResult
  ): ChangeRequestFeedback => {
    if (result.status === 'success')
      return {
        tone: 'success',
        text: t(`result.${result.action}`),
      }
    if (result.status === 'stale')
      return {
        tone: 'info',
        text: t(`stale.${result.outcome ?? 'unknown'}`),
      }
    return { tone: 'critical', text: t(`error.${result.action}`) }
  }

  return {
    age: formatUpdatedAt(summary.opened_at, locale, timeZone),
    ack: changeRequestAckView(summary),
    contact: customerContact(phone),
    resend,
    resendText,
    canAct,
    pending,
    disabled: {
      confirm: !canAct || busy,
      cancel: !canAct || busy,
      resend: !canAct || busy || isResendBusy(resend),
    },
    run: async (action) => {
      const result = await run(action, {
        verificationId,
        changeRequestId: summary.id,
        confirmationCycle: summary.confirmation_cycle,
      })
      return result ? feedbackOf(result) : null
    },
  }
}
