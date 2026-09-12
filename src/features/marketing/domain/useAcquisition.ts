'use client'

import { useMemo } from 'react'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  getAcquisitionTargets,
  type AcquisitionTargets,
} from './acquisitionPaths'

interface UseAcquisitionResult {
  locale: string
  isRTL: boolean
  targets: AcquisitionTargets
}

/**
 * Resolves both acquisition destinations for the current locale.
 *
 * Intentionally stateless — the visitor's Shopify-vs-standalone choice is not
 * page-wide state; both paths are always shown. Only `HowItWorks` keeps a local
 * tab selection.
 */
export function useAcquisition(): UseAcquisitionResult {
  const { locale, isRTL } = useLocaleInfo()
  const targets = useMemo(() => getAcquisitionTargets(locale), [locale])

  return { locale, isRTL, targets }
}
