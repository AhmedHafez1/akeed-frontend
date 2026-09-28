'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { fetchSettings } from '../api/settingsApi'

/**
 * The store's rule for orders with no payment method: confirm them as cash on
 * delivery, or leave them out. `undefined` until the settings are read.
 */
export function useAssumeCodWhenPaymentMissing(): boolean | undefined {
  const { data } = useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: fetchSettings,
  })
  return data?.state.assumeCodWhenPaymentMissing
}
