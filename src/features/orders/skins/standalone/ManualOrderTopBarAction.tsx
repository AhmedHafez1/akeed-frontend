'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { createLogger } from '@/shared/lib/logger'
import {
  manualOrderAvailabilityOptions,
  type ManualOrderAvailability,
} from '../../api/manualOrderQueries'
import { ManualOrderEntryStandalone } from './ManualOrderEntryStandalone'

const logger = createLogger('ManualOrder')

type Availability = { status: 'loading' } | ManualOrderAvailability

export function ManualOrderTopBarAction() {
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
  const disabledReasonOverride =
    availability.status === 'loading'
      ? t('availabilityLoading')
      : availability.status === 'unavailable'
        ? t('availabilityUnavailable')
        : creditFeedbackKey(availability.creditDenial)
          ? tCredits(creditFeedbackKey(availability.creditDenial)!)
          : undefined

  return (
    <ManualOrderEntryStandalone
      canCreate={isReady && availability.canCreate}
      sourceConnected={isReady && availability.sourceConnected}
      isAtPlanLimit={isReady && availability.isAtPlanLimit}
      disabledReasonOverride={disabledReasonOverride}
      showDisabledReason={false}
      // A 44px icon on phones; labelled from 640px (the primary action).
      triggerClassName="size-11 gap-2 px-0 sm:h-10 sm:w-auto sm:px-3.5"
      triggerLabelClassName="hidden text-sm sm:inline"
    />
  )
}
