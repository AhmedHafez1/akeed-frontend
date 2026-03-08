'use client'

import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client singleton.
 *
 * Lazily initialised on first call and cached for the lifetime of the page.
 * Import `getSupabaseClient` anywhere you need direct Supabase access.
 * For API requests, use `api` from `@/lib/api-client` instead.
 */

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
  if (supabaseClient) return supabaseClient

  const supabaseUrl = getRequiredPublicEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getRequiredPublicEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}
