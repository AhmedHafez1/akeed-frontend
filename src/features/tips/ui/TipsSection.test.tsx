import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { notify } from '@/shared/ui'
import { testLocale } from '../../../../test/vitest/setup'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import type { TipCard, TipCardsResponse } from '../model/tips.model'
import { TipsSection } from './TipsSection'

const auth = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  fetchWithAuth: vi.fn(),
}))
vi.mock('@/shared/lib/auth', () => auth)

/** IntersectionObserver that the test drives by hand. */
class FakeObserver {
  static instances: FakeObserver[] = []
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit
  ) {
    FakeObserver.instances.push(this)
  }
  element: Element | null = null
  observe(element: Element) {
    this.element = element
  }
  disconnect() {
    this.element = null
  }
  unobserve() {}
  takeRecords() {
    return []
  }
  fire(ratio: number) {
    if (!this.element) return
    this.callback(
      [
        {
          isIntersecting: ratio > 0,
          intersectionRatio: ratio,
          target: this.element,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver
    )
  }
}

function card(overrides: Partial<TipCard> = {}): TipCard {
  return {
    id: 'c1',
    type: 'tip',
    locale: 'ar',
    title: 'ساعات الهدوء',
    description: 'أوقف الرسائل ليلًا.\nسطر ثانٍ.',
    action: null,
    published_at: '2026-10-25T10:00:00.000Z',
    ...overrides,
  }
}

function setup(response: TipCardsResponse | Error, lang: 'ar' | 'en' = 'ar') {
  testLocale.current = lang
  if (response instanceof Error) auth.api.get.mockRejectedValue(response)
  else auth.api.get.mockResolvedValue(response)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={lang}
        messages={lang === 'ar' ? ar : en}
        timeZone="UTC"
      >
        <TipsSection />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

const posts = () => auth.api.post.mock.calls.map(([url]) => url as string)

describe('TipsSection', () => {
  beforeEach(() => {
    FakeObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    auth.api.post.mockResolvedValue({ recorded: true })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('shows every card in the order received, newest first', async () => {
    setup({
      can_dismiss: true,
      cards: [
        card({ id: 'new', title: 'الأحدث' }),
        card({ id: 'old', title: 'الأقدم', type: 'update' }),
        card({ id: 'change', title: 'تغيير', type: 'change' }),
        card({ id: 'note', title: 'معلومة', type: 'note' }),
      ],
    })
    const headings = await screen.findAllByRole('heading', { level: 3 })
    expect(headings.map((node) => node.textContent)).toEqual([
      'الأحدث',
      'الأقدم',
      'تغيير',
      'معلومة',
    ])
    expect(screen.getByText(ar.tips.badge.update)).toBeTruthy()
    expect(screen.getByText(ar.tips.badge.change)).toBeTruthy()
    expect(screen.getByText(ar.tips.badge.note)).toBeTruthy()
    expect(auth.api.get).toHaveBeenCalledWith(
      '/api/tips?locale=ar',
      expect.anything()
    )
  })

  it('renders nothing with no cards or when the read fails', async () => {
    const empty = setup({ can_dismiss: true, cards: [] })
    await waitFor(() => expect(auth.api.get).toHaveBeenCalled())
    expect(empty.container.innerHTML).toBe('')
    empty.unmount()

    const failed = setup(new Error('down'))
    await waitFor(() => expect(auth.api.get).toHaveBeenCalledTimes(2))
    expect(failed.container.innerHTML).toBe('')
  })

  it('counts a view only once the card is on screen, and only once', async () => {
    setup({ can_dismiss: true, cards: [card()] })
    await screen.findByRole('heading', { level: 3 })
    expect(posts()).toEqual([])
    const [observer] = FakeObserver.instances
    act(() => observer.fire(0.2))
    expect(posts()).toEqual([])
    act(() => observer.fire(0.8))
    act(() => observer.fire(1))
    expect(posts()).toEqual(['/api/tips/c1/view'])
  })

  it('removes a dismissed card at once and restores it if saving fails', async () => {
    const error = vi.spyOn(notify, 'error').mockImplementation(() => '')
    auth.api.post.mockRejectedValue(new Error('offline'))
    setup({ can_dismiss: true, cards: [card()] })
    const dismiss = await screen.findByRole('button', {
      name: ar.tips.dismiss.replace('{title}', 'ساعات الهدوء'),
    })
    fireEvent.click(dismiss)
    await waitFor(() => expect(posts()).toContain('/api/tips/c1/dismiss'))
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        expect.objectContaining({ message: ar.tips.dismissError })
      )
    )
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'ساعات الهدوء'
    )
  })

  it('hides the dismiss control from viewers', async () => {
    setup({ can_dismiss: false, cards: [card()] })
    await screen.findByRole('heading', { level: 3 })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('writes English fallback content left to right inside an Arabic page', async () => {
    setup({
      can_dismiss: true,
      cards: [
        card({
          locale: 'en',
          title: 'Quiet hours',
          description: 'Hold sends.',
        }),
      ],
    })
    const heading = await screen.findByRole('heading', { name: 'Quiet hours' })
    const content = heading.parentElement!
    expect(content.getAttribute('dir')).toBe('ltr')
    expect(content.getAttribute('lang')).toBe('en')
  })

  it('opens external links safely and internal links in the app, recording the click', async () => {
    setup(
      {
        can_dismiss: true,
        cards: [
          card({
            id: 'ext',
            locale: 'en',
            title: 'Guide',
            action: {
              kind: 'external',
              url: 'https://akeed.app/docs',
              label: 'Read the guide',
            },
          }),
          card({
            id: 'int',
            locale: 'en',
            title: 'Settings',
            action: {
              kind: 'internal',
              route: 'settings_timing',
              label: 'Open settings',
            },
          }),
          card({
            id: 'unsafe',
            locale: 'en',
            title: 'Unsafe',
            action: {
              kind: 'external',
              url: 'javascript:alert(1)',
              label: 'Run',
            },
          }),
        ],
      },
      'en'
    )
    const external = await screen.findByRole('link', { name: /Read the guide/ })
    expect(external.getAttribute('target')).toBe('_blank')
    expect(external.getAttribute('rel')).toBe('noopener noreferrer')
    const internal = screen.getByRole('link', { name: 'Open settings' })
    expect(internal.getAttribute('href')).toBe('/en/settings?tab=timing')
    expect(screen.queryByRole('link', { name: 'Run' })).toBeNull()

    fireEvent.click(external)
    expect(posts()).toContain('/api/tips/ext/click')
  })
})
