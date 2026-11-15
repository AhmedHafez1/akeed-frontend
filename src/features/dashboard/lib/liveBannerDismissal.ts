const PREFIX = 'akeed:live-banner-dismissed:'
const sessionDismissals = new Set<string>()
const listeners = new Set<() => void>()

export function liveBannerDismissalKey(
  integrationId: string | undefined,
  setupCompletedAt: string | null | undefined
): string | null {
  return integrationId && setupCompletedAt
    ? `${PREFIX}${integrationId}:${setupCompletedAt}`
    : null
}

export function readLiveBannerDismissal(key: string): boolean {
  if (sessionDismissals.has(key)) return true
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return sessionDismissals.has(key)
  }
}

export function dismissLiveBanner(key: string): void {
  try {
    window.localStorage.setItem(key, '1')
  } catch {
    sessionDismissals.add(key)
    console.warn('[Dashboard] Banner dismissal could not be persisted')
  }
  listeners.forEach((listener) => listener())
}

export function subscribeToLiveBannerDismissal(
  listener: () => void
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREFIX)) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
