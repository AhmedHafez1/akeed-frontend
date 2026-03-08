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

let supabaseClient: ReturnType<typeof createClient> | null = null

function getRequiredPublicEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[Auth] Missing required environment variable: ${name}. ` +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for frontend auth.'
    )
  }
  return value
}

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = getRequiredPublicEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getRequiredPublicEnvVar(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )

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
 */
async function getShopifySessionToken(): Promise<string | null> {
  try {
    const shopify = window.shopify

    if (!shopify) {
      console.error(
        '[Auth] window.shopify not available — App Bridge CDN script may not be loaded'
      )
      return null
    }

    const token = await shopify.idToken()
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
    console.error('[Auth] Unauthorized - redirecting to login')

    // Redirect to login if in standalone mode
    const { isEmbedded } = resolveEmbeddedContextFromWindow()

    if (!isEmbedded && typeof window !== 'undefined') {
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
