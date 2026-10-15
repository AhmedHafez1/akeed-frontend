import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { useMerchantLogo } from './useMerchantLogo'

const auth = vi.hoisted(() => ({
  uploadWithAuth: vi.fn(),
  api: { delete: vi.fn() },
}))

// The transport under the branding calls: no request leaves the test.
vi.mock('@/shared/lib/auth', () => auth)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const SAVED = {
  logoUrl: 'https://cdn.test/l.png',
  bannerUrl: 'https://cdn.test/b.jpg',
  updatedAt: '2026-10-15T10:00:00.000Z',
  logoHeaderAvailable: true,
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  client.setQueryData(queryKeys.settings.detail(), {
    state: { storeName: 'Kept' },
    branding: { ...SAVED, logoUrl: null, bannerUrl: null },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () => useMerchantLogo({ ...SAVED, logoUrl: null, bannerUrl: null }),
    { wrapper }
  )
  return { client, hook }
}

const png = () => new File(['png'], 'logo.png', { type: 'image/png' })

describe('useMerchantLogo', () => {
  beforeEach(() => {
    auth.uploadWithAuth.mockReset()
    auth.api.delete.mockReset()
  })

  it('refuses a wrong type without uploading', () => {
    const { hook } = setup()
    act(() =>
      hook.result.current.choose(
        new File(['x'], 'logo.webp', { type: 'image/webp' })
      )
    )
    expect(hook.result.current.error).toBe('unsupportedType')
    expect(auth.uploadWithAuth).not.toHaveBeenCalled()
  })

  it('stores the new branding without touching the rest of the settings', async () => {
    auth.uploadWithAuth.mockResolvedValue(json(200, SAVED))
    const { hook, client } = setup()

    act(() => hook.result.current.choose(png()))

    await waitFor(() =>
      expect(client.getQueryData(queryKeys.settings.detail())).toEqual({
        state: { storeName: 'Kept' },
        branding: SAVED,
      })
    )
    expect(hook.result.current.error).toBeNull()
  })

  it('shows the message for the backend code', async () => {
    auth.uploadWithAuth.mockResolvedValue(
      json(422, { message: 'small', code: 'LOGO_IMAGE_TOO_SMALL' })
    )
    const { hook } = setup()

    act(() => hook.result.current.choose(png()))

    await waitFor(() => expect(hook.result.current.error).toBe('tooSmall'))
  })

  it('removes the logo', async () => {
    auth.api.delete.mockResolvedValue({
      ...SAVED,
      logoUrl: null,
      bannerUrl: null,
      updatedAt: null,
    })
    const { hook } = setup()

    act(() => hook.result.current.remove())

    await waitFor(() =>
      expect(auth.api.delete).toHaveBeenCalledWith('/api/settings/logo')
    )
  })
})
