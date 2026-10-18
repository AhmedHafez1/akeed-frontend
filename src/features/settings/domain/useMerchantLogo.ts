'use client'

import { useCallback, useState } from 'react'
import {
  useMerchantLogoMutations,
  type MerchantBranding,
} from '@/features/settings/api/brandingApi'
import {
  logoErrorKey,
  logoFileProblem,
  type LogoErrorKey,
} from './merchantLogo'

export interface MerchantLogoModel {
  branding: MerchantBranding
  /** Shown unless staff switched the store's logo header off. */
  isAvailable: boolean
  /** Shown but locked: the store's plan does not include the logo. */
  isLocked: boolean
  isUploading: boolean
  isRemoving: boolean
  error: LogoErrorKey | null
  /** Checks the file, then uploads it; a new logo replaces the old one. */
  choose: (file: File | undefined) => void
  remove: () => void
}

/** Run after the server accepted the change, for example to show a toast. */
export interface MerchantLogoCallbacks {
  onUploaded?: () => void
  onRemoved?: () => void
}

const NO_BRANDING: MerchantBranding = {
  logoUrl: null,
  bannerUrl: null,
  updatedAt: null,
  logoHeaderAvailable: false,
  logoHeaderIncluded: false,
}

/** The logo card's state for both skins. */
export function useMerchantLogo(
  branding: MerchantBranding | undefined,
  { onUploaded, onRemoved }: MerchantLogoCallbacks = {}
): MerchantLogoModel {
  const { upload, remove } = useMerchantLogoMutations()
  const [error, setError] = useState<LogoErrorKey | null>(null)
  const current = branding ?? NO_BRANDING
  const isLocked = current.logoHeaderAvailable && !current.logoHeaderIncluded

  const choose = useCallback(
    (file: File | undefined) => {
      if (!file || isLocked) return
      const problem = logoFileProblem(file)
      setError(problem)
      if (problem) return
      upload.mutate(file, {
        onSuccess: () => onUploaded?.(),
        onError: (failure) => setError(logoErrorKey(failure)),
      })
    },
    [upload, onUploaded, isLocked]
  )

  const removeLogo = useCallback(() => {
    setError(null)
    remove.mutate(undefined, {
      onSuccess: () => onRemoved?.(),
      onError: (failure) => setError(logoErrorKey(failure)),
    })
  }, [remove, onRemoved])

  return {
    branding: current,
    isAvailable: current.logoHeaderAvailable,
    isLocked,
    isUploading: upload.isPending,
    isRemoving: remove.isPending,
    error,
    choose,
    remove: removeLogo,
  }
}
