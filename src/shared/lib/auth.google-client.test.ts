import { afterEach, expect, it, vi } from 'vitest'
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}))
afterEach(() => vi.unstubAllEnvs())
it('isolates PKCE storage without changing implicit email-link session handling', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-public-key')
  vi.resetModules()
  const { createClient } = await import('@supabase/supabase-js')
  const { getSupabaseClient, createGoogleOAuthClient } = await import('./auth')
  getSupabaseClient()
  createGoogleOAuthClient('test-google', sessionStorage)
  expect(createClient).toHaveBeenNthCalledWith(
    1,
    'https://synthetic.supabase.co',
    'synthetic-public-key',
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
  expect(createClient).toHaveBeenNthCalledWith(
    2,
    'https://synthetic.supabase.co',
    'synthetic-public-key',
    {
      auth: {
        storageKey: 'test-google',
        storage: sessionStorage,
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
})
