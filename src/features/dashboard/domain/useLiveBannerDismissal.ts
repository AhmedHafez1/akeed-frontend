'use client'

import { useSyncExternalStore } from 'react'
import {
  dismissLiveBanner,
  liveBannerDismissalKey,
  readLiveBannerDismissal,
  subscribeToLiveBannerDismissal,
} from '../lib/liveBannerDismissal'

// Keep the banner hidden until browser storage has been checked during hydration.
const serverSnapshot = () => true

export function useLiveBannerDismissal(
  integrationId: string | undefined,
  setupCompletedAt: string | null | undefined
) {
  const key = liveBannerDismissalKey(integrationId, setupCompletedAt)
  const dismissed = useSyncExternalStore(
    subscribeToLiveBannerDismissal,
    () => (key ? readLiveBannerDismissal(key) : true),
    serverSnapshot
  )
  return {
    dismissed,
    dismiss: () => {
      if (key) dismissLiveBanner(key)
    },
  }
}
