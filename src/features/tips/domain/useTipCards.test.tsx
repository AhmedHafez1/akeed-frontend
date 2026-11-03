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

function setup(
  mode: 'embedded' | 'standalone' = 'embedded',
  overrides: Partial<TipCardsResponse> = {}
) {
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
    ...overrides,
  }
  for (const locale of ['en', 'ar'])
    client.setQueryData(queryKeys.tips.cards(locale), data)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const onDismissError = vi.fn()
  return {
    client,
    data,
    onDismissError,
    ...renderHook(() => useTipCards({ mode, enabled: false, onDismissError }), {
      wrapper,
    }),
  }
}

describe('useTipCards read status', () => {
  it('records a new view for a reissued generation without accepting an old view response', async () => {
    let finishOld!: (value: { recorded: boolean }) => void
    auth.api.post.mockReturnValueOnce(
      new Promise((resolve) => {
        finishOld = resolve
      })
    )
    const { result, client, data } = setup()
    act(() => result.current.onSeen('one', 1))
    const next = {
      ...data,
      cards: data.cards.map((card) => ({
        ...card,
        delivery_generation: 2,
        first_viewed_at: null,
      })),
    }
    act(() => client.setQueryData(queryKeys.tips.cards('en'), next))
    await waitFor(() =>
      expect(result.current.cards[0].card.delivery_generation).toBe(2)
    )
    await act(async () => {
      finishOld({ recorded: true })
      await Promise.resolve()
    })
    expect(result.current.cards[0].card.first_viewed_at).toBeNull()
    act(() => result.current.onSeen('one', 2))
    await waitFor(() =>
      expect(result.current.cards[0].card.first_viewed_at).toEqual(
        expect.any(String)
      )
    )
    expect(auth.api.post).toHaveBeenCalledWith(
      '/api/tips/one/view',
      { delivery_generation: 2 },
      { keepalive: true }
    )
  })

  it('keeps a server-ignored view unread', async () => {
    auth.api.post.mockResolvedValue({ recorded: false })
    const { result } = setup()
    act(() => result.current.onSeen('one', 1))
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.cards[0].card.first_viewed_at).toBeNull()
  })

  it('does not roll a newer delivery back after an old dismissal fails', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let failOld!: (reason: unknown) => void
    auth.api.post.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        failOld = reject
      })
    )
    const { result, client, data } = setup()
    act(() => result.current.onDismiss('one', 1))
    await waitFor(() => expect(result.current.cards).toHaveLength(0))
    act(() =>
      client.setQueryData(queryKeys.tips.cards('en'), {
        ...data,
        cards: data.cards.map((card) => ({
          ...card,
          delivery_generation: 2,
          first_viewed_at: null,
        })),
      })
    )
    await act(async () => {
      failOld(new Error('Offline'))
      await Promise.resolve()
    })
    await waitFor(() =>
      expect(result.current.cards[0].card.delivery_generation).toBe(2)
    )
    expect(result.current.cards[0].card.first_viewed_at).toBeNull()
    warning.mockRestore()
  })
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

  const card = (id: string, show_as_banner?: boolean) => ({
    id,
    type: 'tip' as const,
    locale: 'en',
    title: id,
    description: 'Body',
    action: null,
    published_at: '2026-10-25T10:00:00.000Z',
    show_as_banner,
  })

  it('selects the first flagged card in publication order and keeps it in the cards', () => {
    const { result } = setup('standalone', {
      cards: [card('unflagged'), card('newest', true), card('older', true)],
    })
    expect(result.current.banner?.card.id).toBe('newest')
    expect(result.current.cards.map((view) => view.card.id)).toEqual([
      'unflagged',
      'newest',
      'older',
    ])
  })

  it('has no banner when flags are false, missing, or cards are empty', () => {
    const unflagged = setup('standalone', {
      cards: [card('old-api'), card('off', false)],
    })
    expect(unflagged.result.current.banner).toBeNull()
    const empty = setup('standalone', { cards: [] })
    expect(empty.result.current.banner).toBeNull()
  })

  it('dismisses the banner and card together, advancing to the next flagged card', async () => {
    const { result } = setup('standalone', {
      cards: [card('new', true), card('old', true)],
    })
    act(() => result.current.onDismiss('new'))
    await waitFor(() => expect(result.current.banner?.card.id).toBe('old'))
    expect(result.current.cards.map((view) => view.card.id)).toEqual(['old'])
    expect(auth.api.post).toHaveBeenCalledWith('/api/tips/new/dismiss', {
      delivery_generation: 1,
    })
  })

  it('restores the banner and card when permanent dismissal fails', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let rejectDismiss!: (error: Error) => void
    auth.api.post.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectDismiss = reject
      })
    )
    const { result, onDismissError } = setup('standalone', {
      cards: [card('new', true), card('old', true)],
    })
    act(() => result.current.onDismiss('new'))
    await waitFor(() => expect(result.current.banner?.card.id).toBe('old'))
    act(() => rejectDismiss(new Error('offline')))
    await waitFor(() => expect(onDismissError).toHaveBeenCalledOnce())
    expect(result.current.banner?.card.id).toBe('new')
    expect(result.current.cards.map((view) => view.card.id)).toEqual([
      'new',
      'old',
    ])
    warning.mockRestore()
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
