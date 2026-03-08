'use client'

import { resolveEmbeddedContextFromWindow } from './embedded-context'
import { getSupabaseClient } from './supabase'
import { getErrorMessage, parseJsonResponse } from './http'
import { withLocale } from './locale'

/**
 * Akeed API Client
 *
 * Provides a unified `api` object that automatically:
 * 1. Detects the current runtime mode (EMBEDDED vs STANDALONE)
 * 2. Fetches the appropriate authentication token
 * 3. Injects the token into API requests
 *
 * Token Types:
 * - EMBEDDED:   Shopify Session Token (via App Bridge)
 * - STANDALONE: Supabase JWT (via Supabase Auth)
 *
 * Import: `import { api } from '@/lib/api-client'`
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

// ─── Token resolution ─────────────────────────────────────────────────────────

async function getShopifySessionToken(): Promise<string | null> {
  try {
    const shopify = window.shopify
    if (!shopify) {
      console.error(
        '[Auth] window.shopify not available — App Bridge CDN script may not be loaded'
      )
      return null
    }
    return await shopify.idToken()
  } catch (error) {
    console.error('[Auth] Failed to get Shopify session token:', error)
    return null
  }
}

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

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const { isEmbedded } = resolveEmbeddedContextFromWindow()
  return isEmbedded ? getShopifySessionToken() : getSupabaseToken()
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('ngrok-skip-browser-warning', 'true')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    console.warn('[Auth] No authentication token available')
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
  const response = await fetch(fullUrl, { ...options, headers })

  if (response.status === 401) {
    console.error('[Auth] Unauthorized - redirecting to login')
    const { isEmbedded } = resolveEmbeddedContextFromWindow()
    if (!isEmbedded && typeof window !== 'undefined') {
      window.location.href = withLocale('/login')
    }
  }

  return response
}

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
  get<T = unknown>(url: string): Promise<T> {
    return request<T>('GET', url)
  },
  post<T = unknown>(url: string, data?: unknown): Promise<T> {
    return request<T>('POST', url, data)
  },
  put<T = unknown>(url: string, data?: unknown): Promise<T> {
    return request<T>('PUT', url, data)
  },
  patch<T = unknown>(url: string, data?: unknown): Promise<T> {
    return request<T>('PATCH', url, data)
  },
  delete<T = unknown>(url: string): Promise<T> {
    return request<T>('DELETE', url)
  },
}
