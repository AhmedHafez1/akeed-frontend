'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, uploadWithAuth } from '@/shared/lib/auth'
import { createApiError, parseJsonResponse } from '@/shared/lib/http'
import { queryKeys } from '@/shared/query/keys'
import type { SettingsResponse } from './settingsApi'

/** The store's logo, the banner built from it, and whether it is sent. */
export interface MerchantBranding {
  logoUrl: string | null
  bannerUrl: string | null
  updatedAt: string | null
  /** Staff switched the logo header on, so the banner goes on messages. */
  logoHeaderAvailable: boolean
}

const PATH = '/api/settings/logo'

/** Rejects with the `ApiError` carrying the backend's `LOGO_*` code. */
export async function uploadLogo(file: File): Promise<MerchantBranding> {
  const body = new FormData()
  body.append('logo', file, file.name)
  const response = await uploadWithAuth(PATH, { body })
  if (!response.ok) throw await createApiError(response)
  return parseJsonResponse<MerchantBranding>(response)
}

export function removeLogo(): Promise<MerchantBranding> {
  return api.delete<MerchantBranding>(PATH)
}

/**
 * Upload and remove write only the `branding` block of the cached settings,
 * so the merchant's unsaved edits elsewhere on the page are kept.
 */
export function useMerchantLogoMutations() {
  const queryClient = useQueryClient()
  const store = (branding: MerchantBranding) =>
    queryClient.setQueryData<SettingsResponse>(
      queryKeys.settings.detail(),
      (current) => (current ? { ...current, branding } : current)
    )
  const upload = useMutation({ mutationFn: uploadLogo, onSuccess: store })
  const remove = useMutation({ mutationFn: removeLogo, onSuccess: store })
  return { upload, remove }
}
