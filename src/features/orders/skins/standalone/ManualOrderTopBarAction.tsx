'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { ManualOrderEntryStandalone } from './ManualOrderEntryStandalone'

const logger = createLogger('ManualOrder')

interface ManualOrderContextResponse {
  page_context?: {
    source?: { status?: string }
    permissions?: { can_create_manual_order?: boolean }
    usage?: { limit?: number; remaining?: number }
  }
}

type Availability =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | {
      status: 'ready'
      canCreate: boolean
      sourceConnected: boolean
      isAtPlanLimit: boolean
    }

export function ManualOrderTopBarAction() {
  const t = useTranslations('manualOrder')
  const [availability, setAvailability] = useState<Availability>({
    status: 'loading',
  })

  useEffect(() => {
    let active = true

    api
      .get<ManualOrderContextResponse>(
        '/api/verifications?date_range=today&limit=1'
      )
      .then((response) => {
        if (!active) return
        if (!response.page_context) {
          setAvailability({ status: 'unavailable' })
          return
        }
        setAvailability({
          status: 'ready',
          canCreate:
            response.page_context.permissions?.can_create_manual_order === true,
          sourceConnected: response.page_context.source?.status === 'connected',
          isAtPlanLimit:
            (response.page_context.usage?.limit ?? 0) > 0 &&
            (response.page_context.usage?.remaining ?? 1) <= 0,
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        logger.warn('Unable to load manual-order availability', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        setAvailability({ status: 'unavailable' })
      })

    return () => {
      active = false
    }
  }, [])

  const isReady = availability.status === 'ready'
  const disabledReasonOverride =
    availability.status === 'loading'
      ? t('availabilityLoading')
      : availability.status === 'unavailable'
        ? t('availabilityUnavailable')
        : undefined

  return (
    <ManualOrderEntryStandalone
      canCreate={isReady && availability.canCreate}
      sourceConnected={isReady && availability.sourceConnected}
      isAtPlanLimit={isReady && availability.isAtPlanLimit}
      disabledReasonOverride={disabledReasonOverride}
      showDisabledReason={false}
      triggerClassName="h-9 px-2.5"
      triggerLabelClassName="hidden xl:inline"
    />
  )
}
