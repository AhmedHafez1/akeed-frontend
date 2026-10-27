import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/shared/query/keys'
import type { TipCardsResponse } from '../model/tips.model'
import { useTipCards } from './useTipCards'

const auth = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/shared/lib/auth', () => auth)
vi.mock('@/shared/hooks/useLocaleInfo', () => ({
  useLocaleInfo: () => ({ locale: 'en' }),
}))

function setup(mode: 'embedded' | 'standalone' = 'embedded') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const data: TipCardsResponse = {
    can_dismiss: true,
    cards: [
      {
        id: 'one',
        type: 'tip',
        locale: 'en',
        title: 'Logo',
        description: 'Body',
        action: null,
        published_at: '2026-10-25T10:00:00.000Z',
        first_viewed_at: null,
      },
    ],
  }
  for (const locale of ['en', 'ar'])
    client.setQueryData(queryKeys.tips.cards(locale), data)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return {
    client,
    data,
    ...renderHook(
      () => useTipCards({ mode, enabled: false, onDismissError: vi.fn() }),
      { wrapper }
    ),
  }
}

describe('useTipCards read status', () => {
  beforeEach(() => {
    auth.api.post.mockResolvedValue({ recorded: true })
  })
  afterEach(() => vi.clearAllMocks())

  it('persists a view once and updates every cached locale without removing cards', async () => {
    const { result, client } = setup()
    act(() => {
      result.current.onSeen('one')
      result.current.onSeen('one')
    })
    await waitFor(() =>
      expect(result.current.cards[0].card.first_viewed_at).toEqual(
        expect.any(String)
      )
    )
    expect(auth.api.post).toHaveBeenCalledTimes(1)
    for (const locale of ['en', 'ar']) {
      const cards = client.getQueryData<TipCardsResponse>(
        queryKeys.tips.cards(locale)
      )!.cards
      expect(cards).toHaveLength(1)
      expect(cards[0].first_viewed_at).toEqual(expect.any(String))
    }
    act(() => result.current.onSeen('one'))
    expect(auth.api.post).toHaveBeenCalledTimes(1)
  })

  it('keeps a failed recording unread and allows a later retry', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    auth.api.post.mockRejectedValueOnce(new Error('Offline'))
    const { result } = setup()
    act(() => result.current.onSeen('one'))
    await waitFor(() => expect(warning).toHaveBeenCalledTimes(1))
    expect(result.current.cards[0].card.first_viewed_at).toBeNull()
    act(() => result.current.onSeen('one'))
    await waitFor(() =>
      expect(result.current.cards[0].card.first_viewed_at).toEqual(
        expect.any(String)
      )
    )
    expect(auth.api.post).toHaveBeenCalledTimes(2)
    warning.mockRestore()
  })

  it('records a read immediately when an embedded action is clicked', async () => {
    const { result } = setup()
    act(() => result.current.onAction('one'))
    expect(auth.api.post.mock.calls.map(([url]) => url)).toEqual([
      '/api/tips/one/view',
      '/api/tips/one/click',
    ])
    await waitFor(() =>
      expect(result.current.cards[0].card.first_viewed_at).toEqual(
        expect.any(String)
      )
    )
  })

  it('keeps standalone action tracking unchanged', () => {
    const { result } = setup('standalone')
    act(() => result.current.onAction('one'))
    expect(auth.api.post.mock.calls.map(([url]) => url)).toEqual([
      '/api/tips/one/click',
    ])
  })

  it('does not resurrect a card dismissed while its view was being recorded', async () => {
    let resolveView!: (value: unknown) => void
    auth.api.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveView = resolve
      })
    )
    const { result, client, data } = setup()
    act(() => result.current.onSeen('one'))
    await act(async () => {
      client.setQueryData(queryKeys.tips.cards('en'), { ...data, cards: [] })
      resolveView({ recorded: true })
    })
    expect(
      client.getQueryData<TipCardsResponse>(queryKeys.tips.cards('en'))!.cards
    ).toEqual([])
    expect(
      client.getQueryData<TipCardsResponse>(queryKeys.tips.cards('ar'))!
        .cards[0].first_viewed_at
    ).toEqual(expect.any(String))
  })
})
