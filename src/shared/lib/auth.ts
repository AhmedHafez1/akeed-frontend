'use client'
import { createClient } from '@supabase/supabase-js'
import { resolveEmbeddedContextFromWindow } from '@/shared/lib/embedded-context'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import { withLocale } from '@/shared/lib/locale'

/**
 * Akeed API Client with Dual Authentication
 *
 * This module provides a unified API client that automatically:
 * 1. Detects the current runtime mode (EMBEDDED vs STANDALONE)
 * 2. Fetches the appropriate authentication token
 * 3. Injects the token into API requests
 *
 * Token Types:
 * - EMBEDDED: Shopify Session Token (via App Bridge)
 * - STANDALONE: Supabase JWT (via Supabase Auth)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabasePublicConfig(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      '[Auth] Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Set both values for frontend auth and restart the Next.js dev server.'
    )
  }

  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  }
}

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } =
    getSupabasePublicConfig()

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

/**
 * Get authentication token based on current mode
 */
async function getAuthToken(): Promise<string | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null
  }

  // Detect mode from URL parameters
  const { isEmbedded } = resolveEmbeddedContextFromWindow()

  if (isEmbedded) {
    // EMBEDDED MODE: Get Shopify Session Token
    return await getShopifySessionToken()
  } else {
    // STANDALONE MODE: Get Supabase JWT
    return await getSupabaseToken()
  }
}

/**
 * Get Shopify Session Token (for embedded mode)
 *
 * In App Bridge v4, the CDN script exposes `window.shopify` with an
 * `idToken()` method that returns the current session token (JWT).
 * No npm package or App Bridge instance is needed.
 *
 * The token is cached until 5 seconds before its JWT `exp` claim to
 * avoid repeated async App Bridge round-trips when multiple
 * `fetchWithAuth` calls fire in parallel during a single page mount.
 */

interface SessionTokenCache {
  token: string
  expiresAt: number
}

let sessionTokenCache: SessionTokenCache | null = null

/** Fallback TTL when the JWT `exp` claim cannot be parsed. */
const SESSION_TOKEN_FALLBACK_TTL_MS = 30_000

/** Safety margin subtracted from JWT `exp` to avoid serving near-expiry tokens. */
const SESSION_TOKEN_EXPIRY_MARGIN_MS = 5_000

/**
 * Decode the `exp` claim from a JWT without pulling in a library.
 * Returns epoch-seconds or null if the token cannot be parsed.
 */
function getJwtExpiry(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    const payload = JSON.parse(json) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

/** Clear the cached session token so the next call fetches a fresh one. */
function clearSessionTokenCache(): void {
  sessionTokenCache = null
}

async function getShopifySessionToken(): Promise<string | null> {
  try {
    if (sessionTokenCache && Date.now() < sessionTokenCache.expiresAt) {
      return sessionTokenCache.token
    }

    const shopify = window.shopify

    if (!shopify) {
      console.error(
        '[Auth] window.shopify not available — App Bridge CDN script may not be loaded'
      )
      return null
    }

    const token = await shopify.idToken()

    if (token) {
      const expSec = getJwtExpiry(token)
      sessionTokenCache = {
        token,
        expiresAt: expSec
          ? expSec * 1000 - SESSION_TOKEN_EXPIRY_MARGIN_MS
          : Date.now() + SESSION_TOKEN_FALLBACK_TTL_MS,
      }
    }

    return token
  } catch (error) {
    console.error('[Auth] Failed to get Shopify session token:', error)
    return null
  }
}

/**
 * Get Supabase JWT (for standalone mode)
 */
async function getSupabaseToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      console.warn('[Auth] No Supabase session found')
      return null
    }

    return session.access_token
  } catch (error) {
    console.error('[Auth] Failed to get Supabase token:', error)
    return null
  }
}

/**
 * Enhanced fetch with automatic authentication
 *
 * Usage:
 * ```ts
 * const data = await fetchWithAuth('/api/orders');
 * ```
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get authentication token
  const token = await getAuthToken()

  // Prepare headers
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  // Bypass Ngrok browser warning
  headers.set('ngrok-skip-browser-warning', 'true')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    console.warn('[Auth] No authentication token available')
  }

  // Make request
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized
  if (response.status === 401) {
    const { isEmbedded } = resolveEmbeddedContextFromWindow()

    if (isEmbedded) {
      // In embedded mode, a 401 likely means the cached session token
      // expired. Clear the cache, fetch a fresh token, and retry once.
      clearSessionTokenCache()
      const freshToken = await getShopifySessionToken()

      if (freshToken) {
        const retryHeaders = new Headers(options.headers)
        retryHeaders.set('Content-Type', 'application/json')
        retryHeaders.set('ngrok-skip-browser-warning', 'true')
        retryHeaders.set('Authorization', `Bearer ${freshToken}`)

        const retryResponse = await fetch(fullUrl, {
          ...options,
          headers: retryHeaders,
        })

        // If the retry also fails with 401, fall through to return it
        // without another retry (no infinite loop).
        return retryResponse
      }
    } else if (typeof window !== 'undefined') {
      // Standalone mode: redirect to login
      console.error('[Auth] Unauthorized - redirecting to login')
      window.location.href = withLocale('/login')
    }
  }

  return response
}

/**
 * Convenience methods for common HTTP verbs
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(
  method: HttpMethod,
  url: string,
  data?: unknown
): Promise<T> {
  const response = await fetchWithAuth(url, {
    method,
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return parseJsonResponse<T>(response)
}

export const api = {
  /**
   * GET request with auth
   */
  get<T = unknown>(url: string): Promise<T> {
    return request<T>('GET', url)
  },

  /**
   * POST request with auth
   */
  post<T = unknown>(url: string, data?: unknown): Promise<T> {
    return request<T>('POST', url, data)
  },

  /**
   * PUT request with auth
   */
  put<T = unknown>(url: string, data?: unknown): Promise<T> {
    return request<T>('PUT', url, data)
  },

  /**
   * PATCH request with auth
   */
  patch<T = unknown>(url: string, data?: unknown): Promise<T> {
    return request<T>('PATCH', url, data)
  },

  /**
   * DELETE request with auth
   */
  delete<T = unknown>(url: string): Promise<T> {
    return request<T>('DELETE', url)
  },
}

/**
 * Auth helpers for standalone mode
 */
export const auth = {
  /**
   * Locale-aware auth paths
   */
  /**
   * Get localized login path
   */
  getLoginPath(locale?: string) {
    return withLocale('/login', locale)
  },

  /**
   * Get localized signup path
   */
  getSignupPath(locale?: string) {
    return withLocale('/signup', locale)
  },

  /**
   * Get localized dashboard path
   */
  getDashboardPath(locale?: string) {
    return withLocale('/dashboard', locale)
  },

  /**
   * Locale-aware auth redirects
   */
  /**
   * Redirect to localized login
   */
  redirectToLogin() {
    if (typeof window !== 'undefined') {
      window.location.href = withLocale('/login')
    }
  },

  /**
   * Redirect to localized signup
   */
  redirectToSignup() {
    if (typeof window !== 'undefined') {
      window.location.href = withLocale('/signup')
    }
  },

  /**
   * Redirect to localized dashboard
   */
  redirectToDashboard() {
    if (typeof window !== 'undefined') {
      window.location.href = withLocale('/dashboard')
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, number | string>
  ) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      console.log(error)
      throw error
    }
    return data
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log(error)
      throw error
    }
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const supabase = getSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const supabase = getSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return !!session
  },
}

/**
 * Utility to check current authentication mode
 */
export function getAuthMode(): 'EMBEDDED' | 'STANDALONE' {
  if (typeof window === 'undefined') return 'STANDALONE'

  const { isEmbedded } = resolveEmbeddedContextFromWindow()

  return isEmbedded ? 'EMBEDDED' : 'STANDALONE'
}
