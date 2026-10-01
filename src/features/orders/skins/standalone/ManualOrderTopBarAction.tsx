'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import {
  manualOrderAvailabilityOptions,
  type ManualOrderAvailability,
} from '../../api/manualOrderQueries'
import { useNewOrderRequest } from '../../domain/useNewOrderRequest'
import { ManualOrderEntryStandalone } from './ManualOrderEntryStandalone'

export { NEW_ORDER_PARAM } from '../../domain/useNewOrderRequest'

const logger = createLogger('ManualOrder')

type Availability = { status: 'loading' } | ManualOrderAvailability

const TRIGGER_STYLES = {
  // A 44px icon on phones; labelled from 640px (the primary action).
  topbar: {
    trigger: 'size-11 gap-2 px-0 sm:h-10 sm:w-auto sm:px-3.5',
    label: 'hidden text-sm sm:inline',
  },
  // The first-run card's full-width primary.
  tile: {
    trigger: 'h-11 w-full gap-2 text-base font-semibold',
    label: undefined,
  },
} as const

/** The quiet look, for a page whose own primary action is something else. */
const SECONDARY_TRIGGER =
  'border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken shadow-none'

export type ManualOrderEmphasis = 'primary' | 'secondary'

interface ManualOrderActionProps {
  variant?: keyof typeof TRIGGER_STYLES
  emphasis?: ManualOrderEmphasis
}

/**
 * "تأكيد طلب" with its dialog, gated by the manual-order availability, and
 * the one place that honours `?new-order=1`. Only one copy is mounted at a
 * time: the top bar's, or the first-run card's while the top bar hides it.
 */
export function ManualOrderAction({
  variant = 'topbar',
  emphasis = 'primary',
}: ManualOrderActionProps) {
  const t = useTranslations('manualOrder')
  const tCredits = useTranslations('creditErrors')
  const { data, error } = useQuery(manualOrderAvailabilityOptions())

  useEffect(() => {
    if (!error) return
    logger.warn('Unable to load manual-order availability', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })
  }, [error])

  // A failed refresh keeps the last known gate; only a gate never loaded is
  // reported as unavailable.
  const availability: Availability =
    data ?? (error ? { status: 'unavailable' } : { status: 'loading' })

  const isReady = availability.status === 'ready'
  const canOpen = isReady && availability.canCreate
  const newOrder = useNewOrderRequest({
    isGateKnown: availability.status !== 'loading',
    canOpen,
  })

  const disabledReasonOverride =
    availability.status === 'loading'
      ? t('availabilityLoading')
      : availability.status === 'unavailable'
        ? t('availabilityUnavailable')
        : creditFeedbackKey(availability.creditDenial)
          ? tCredits(creditFeedbackKey(availability.creditDenial)!)
          : undefined
  const styles = TRIGGER_STYLES[variant]

  return (
    <ManualOrderEntryStandalone
      canCreate={canOpen}
      sourceConnected={isReady && availability.sourceConnected}
      isAtPlanLimit={isReady && availability.isAtPlanLimit}
      disabledReasonOverride={disabledReasonOverride}
      showDisabledReason={false}
      triggerClassName={cn(
        styles.trigger,
        emphasis === 'secondary' && SECONDARY_TRIGGER
      )}
      triggerLabelClassName={styles.label}
      triggerWrapperClassName={variant === 'tile' ? 'w-full' : undefined}
      autoOpen={newOrder.shouldAutoOpen}
      onAutoOpened={newOrder.onAutoOpened}
    />
  )
}

export function ManualOrderTopBarAction({
  emphasis,
}: {
  emphasis?: ManualOrderEmphasis
}) {
  return <ManualOrderAction variant="topbar" emphasis={emphasis} />
}
