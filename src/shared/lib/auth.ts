'use client'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { resolveEmbeddedContextFromWindow } from '@/shared/lib/embedded-context'
import { createApiError, parseJsonResponse } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
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
const logger = createLogger('Auth')

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

interface StandaloneOrganization {
  id: string
  name: string
  slug: string
  plan_type: string | null
  wa_phone_number_id: string | null
  wa_business_account_id: string | null
  wa_access_token_configured: boolean
}

interface StandaloneOrganizationProvisioningResponse {
  organization: StandaloneOrganization
  created: boolean
}

interface StandaloneBootstrapCache {
  userId: string
  promise: Promise<StandaloneOrganizationProvisioningResponse>
}

let standaloneBootstrapCache: StandaloneBootstrapCache | null = null

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

/**
 * Reuse a session token already issued by App Bridge during embedded startup.
 * This avoids an unnecessary second App Bridge round-trip before the first
 * authenticated API request.
 */
export function primeShopifySessionToken(token: string): void {
  const expSec = getJwtExpiry(token)
  sessionTokenCache = {
    token,
    expiresAt: expSec
      ? expSec * 1000 - SESSION_TOKEN_EXPIRY_MARGIN_MS
      : Date.now() + SESSION_TOKEN_FALLBACK_TTL_MS,
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
      logger.error(
        'window.shopify not available - App Bridge CDN script may not be loaded'
      )
      return null
    }

    const token = await shopify.idToken()

    if (token) {
      primeShopifySessionToken(token)
    }

    return token
  } catch (error) {
    logger.error('Failed to get Shopify session token', error)
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
      logger.warn('No Supabase session found')
      return null
    }

    return session.access_token
  } catch (error) {
    logger.error('Failed to get Supabase token', error)
    return null
  }
}

/**
 * Bodies the browser must describe itself. A `FormData` upload needs the
 * multipart boundary the browser generates, so forcing a Content-Type would
 * make the server unable to read the file.
 */
export function isBrowserEncodedBody(
  body: RequestInit['body'] | undefined
): boolean {
  return (
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof Blob !== 'undefined' && body instanceof Blob) ||
    (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams)
  )
}

/**
 * Headers for every authenticated request. JSON stays the default Content-Type
 * for every other request, exactly as before; only browser-encoded bodies keep
 * the header the browser sets.
 */
export function buildRequestHeaders(
  options: RequestInit,
  token: string | null
): Headers {
  const headers = new Headers(options.headers)
  if (isBrowserEncodedBody(options.body)) {
    headers.delete('Content-Type')
  } else {
    headers.set('Content-Type', 'application/json')
  }
  // Bypass Ngrok browser warning
  headers.set('ngrok-skip-browser-warning', 'true')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

function resolveRequestUrl(url: string, isEmbedded: boolean): string {
  if (url.startsWith('http') || isEmbedded) return url
  return `${API_BASE_URL}${url}`
}

type Transport = (fullUrl: string, headers: Headers) => Promise<Response>

/**
 * Authenticates one request and sends it through `transport`, with the same
 * token, URL and 401 handling whether it goes out as `fetch` or as an XHR.
 */
async function sendWithAuth(
  url: string,
  options: RequestInit,
  transport: Transport
): Promise<Response> {
  // Get authentication token
  const token = await getAuthToken()

  const headers = buildRequestHeaders(options, token)
  if (!token) {
    logger.warn('No authentication token available')
  }

  // Make request
  const { isEmbedded } = resolveEmbeddedContextFromWindow()
  const fullUrl = resolveRequestUrl(url, isEmbedded)

  const response = await transport(fullUrl, headers)

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (isEmbedded) {
      // In embedded mode, a 401 likely means the cached session token
      // expired. Clear the cache, fetch a fresh token, and retry once.
      clearSessionTokenCache()
      const freshToken = await getShopifySessionToken()

      if (freshToken) {
        const retryHeaders = buildRequestHeaders(options, freshToken)

        // If the retry also fails with 401, fall through to return it
        // without another retry (no infinite loop).
        return transport(fullUrl, retryHeaders)
      }
    } else if (typeof window !== 'undefined') {
      // Standalone mode: redirect to login
      logger.error('Unauthorized - redirecting to login')
      window.location.href = withLocale('/login')
    }
  }

  return response
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
  return sendWithAuth(url, options, (fullUrl, headers) =>
    fetch(fullUrl, { ...options, headers })
  )
}

export interface UploadWithAuthOptions {
  body: FormData
  method?: 'POST' | 'PUT'
  signal?: AbortSignal
  /** Fraction of the request body sent so far, 0 to 1. */
  onUploadProgress?: (fraction: number) => void
}

function xhrTransport({
  body,
  method = 'POST',
  signal,
  onUploadProgress,
}: UploadWithAuthOptions): Transport {
  return (fullUrl, headers) =>
    new Promise<Response>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('The upload was aborted.', 'AbortError'))
        return
      }
      const xhr = new XMLHttpRequest()
      xhr.open(method, fullUrl)
      headers.forEach((value, name) => xhr.setRequestHeader(name, value))
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0)
          onUploadProgress?.(event.loaded / event.total)
      }
      const abort = () => xhr.abort()
      signal?.addEventListener('abort', abort, { once: true })
      const settle = () => signal?.removeEventListener('abort', abort)
      xhr.onload = () => {
        settle()
        const nullBody = [101, 204, 205, 304].includes(xhr.status)
        resolve(
          new Response(nullBody ? null : xhr.responseText, {
            status: xhr.status,
            headers: {
              'Content-Type':
                xhr.getResponseHeader('Content-Type') ?? 'text/plain',
            },
          })
        )
      }
      // The same rejections `fetch` gives, so callers handle both alike.
      xhr.onerror = () => {
        settle()
        reject(new TypeError('Failed to fetch'))
      }
      xhr.onabort = () => {
        settle()
        reject(new DOMException('The upload was aborted.', 'AbortError'))
      }
      xhr.send(body)
    })
}

/**
 * An authenticated multipart upload that reports progress, which `fetch`
 * cannot. It resolves to a `Response` so callers read errors exactly as they
 * do for `fetchWithAuth`.
 */
export async function uploadWithAuth(
  url: string,
  options: UploadWithAuthOptions
): Promise<Response> {
  return sendWithAuth(
    url,
    { method: options.method ?? 'POST', body: options.body },
    xhrTransport(options)
  )
}

/**
 * Convenience methods for common HTTP verbs
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method,
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    throw await createApiError(response)
  }

  return parseJsonResponse<T>(response)
}

export const api = {
  /**
   * GET request with auth
   */
  get<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    return request<T>('GET', url, undefined, options)
  },

  /**
   * POST request with auth
   */
  post<T = unknown>(
    url: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return request<T>('POST', url, data, options)
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

function getUserMetadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key]
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getStandaloneOrganizationName(user: User): string {
  const companyName = getUserMetadataString(user, 'company_name')
  const fullName = getUserMetadataString(user, 'full_name')
  const emailName = user.email?.split('@')[0]?.trim()

  return (companyName ?? fullName ?? emailName ?? 'Workspace').slice(0, 120)
}

export function clearStandaloneOrganizationBootstrap(): void {
  standaloneBootstrapCache = null
}

export async function ensureStandaloneOrganization(
  user: User
): Promise<StandaloneOrganizationProvisioningResponse> {
  if (standaloneBootstrapCache?.userId === user.id) {
    return standaloneBootstrapCache.promise
  }

  const promise = api.post<StandaloneOrganizationProvisioningResponse>(
    '/api/organizations',
    { name: getStandaloneOrganizationName(user) }
  )
  standaloneBootstrapCache = { userId: user.id, promise }

  try {
    return await promise
  } catch (error) {
    if (standaloneBootstrapCache?.promise === promise) {
      standaloneBootstrapCache = null
    }
    throw error
  }
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
    options?: {
      metadata?: Record<string, number | string>
      emailRedirectTo?: string
    }
  ) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.metadata,
        emailRedirectTo: options?.emailRedirectTo,
      },
    })

    if (error) {
      logger.error('Sign up failed', error)
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
      logger.error('Sign in failed', error)
      throw error
    }
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const supabase = getSupabaseClient()
    clearStandaloneOrganizationBootstrap()
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
