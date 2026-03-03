'use client'

export interface EmbeddedContext {
  shopDomain: string | null
  hostParam: string | null
  isEmbedded: boolean
}

const EMBEDDED_CONTEXT_STORAGE_KEY = 'akeed:embedded-context'

function normalizeValue(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isInIframe(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return window.top !== window.self
  } catch {
    return true
  }
}

function persistEmbeddedContext(shopDomain: string, hostParam: string): void {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({ shopDomain, hostParam })
  window.sessionStorage.setItem(EMBEDDED_CONTEXT_STORAGE_KEY, payload)
}

function readPersistedEmbeddedContext(): {
  shopDomain: string
  hostParam: string
} | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(EMBEDDED_CONTEXT_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as {
      shopDomain?: string
      hostParam?: string
    }

    const shopDomain = normalizeValue(parsed.shopDomain ?? null)
    const hostParam = normalizeValue(parsed.hostParam ?? null)
    if (!shopDomain || !hostParam) return null

    return { shopDomain, hostParam }
  } catch {
    return null
  }
}

function resolveFromSearchParams(searchParams: URLSearchParams): {
  shopDomain: string | null
  hostParam: string | null
} {
  return {
    shopDomain: normalizeValue(searchParams.get('shop')),
    hostParam: normalizeValue(searchParams.get('host')),
  }
}

export function resolveEmbeddedContextFromSearch(
  searchParams: URLSearchParams
): EmbeddedContext {
  const fromUrl = resolveFromSearchParams(searchParams)
  if (fromUrl.shopDomain && fromUrl.hostParam) {
    persistEmbeddedContext(fromUrl.shopDomain, fromUrl.hostParam)
    return {
      shopDomain: fromUrl.shopDomain,
      hostParam: fromUrl.hostParam,
      isEmbedded: true,
    }
  }

  if (isInIframe()) {
    const persisted = readPersistedEmbeddedContext()
    if (persisted) {
      return {
        shopDomain: persisted.shopDomain,
        hostParam: persisted.hostParam,
        isEmbedded: true,
      }
    }
  }

  return {
    shopDomain: null,
    hostParam: null,
    isEmbedded: false,
  }
}

export function resolveEmbeddedContextFromWindow(): EmbeddedContext {
  if (typeof window === 'undefined') {
    return {
      shopDomain: null,
      hostParam: null,
      isEmbedded: false,
    }
  }

  const searchParams = new URLSearchParams(window.location.search)
  return resolveEmbeddedContextFromSearch(searchParams)
}

export function appendEmbeddedParamsToPath(params: {
  path: string
  shopDomain: string | null
  hostParam: string | null
}): string {
  const { path, shopDomain, hostParam } = params
  if (!shopDomain || !hostParam) {
    return path
  }

  const url = new URL(path, window.location.origin)
  url.searchParams.set('shop', shopDomain)
  url.searchParams.set('host', hostParam)

  return `${url.pathname}${url.search}`
}
