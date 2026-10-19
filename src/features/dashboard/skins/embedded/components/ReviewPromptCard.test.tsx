import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SHOPIFY_APP_STORE_REVIEW_URL } from '@/shared/lib/shopify-auth'
import type { ShopifyGlobal } from '@/shared/types/window.model'
import { useReviewPrompt } from '../../../domain/useReviewPrompt'
import type {
  ReviewPromptView,
  ReviewRequestCode,
} from '../../../model/reviewPrompt.model'
import { ReviewPromptCard } from './ReviewPromptCard'
import { renderEmbedded } from './embeddedTestUtils'

const auth = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  fetchWithAuth: vi.fn(),
}))

// The transport under the review calls: no request leaves the test.
vi.mock('@/shared/lib/auth', () => auth)

const TITLE = 'نتائج أكيد لمتجرك'
const FALLBACK_TITLE = 'ما رأيك في أكيد حتى الآن؟'
const CTA = 'قيّم أكيد على Shopify'
const LATER = 'ليس الآن'
const THANKS = 'شكرًا لك. تقييمك يساعد التجار الآخرين على الاختيار.'

const RESULTS: ReviewPromptView = {
  visible: true,
  variant: 'results',
  confirmed: 42,
  canceled: 3,
  since: '2026-03-15T12:00:00Z',
}

/** The page's wiring: one hook feeding the card. */
function Harness() {
  const prompt = useReviewPrompt(true)
  return (
    <ReviewPromptCard
      status={prompt.status}
      results={prompt.results}
      requesting={prompt.requesting}
      onRate={prompt.rate}
      onNotNow={prompt.notNow}
    />
  )
}

function setup(view: ReviewPromptView = RESULTS) {
  auth.api.get.mockResolvedValue(view)
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return renderEmbedded(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
    'ar'
  )
}

const posted = () => auth.api.post.mock.calls.map(([, body]) => body)

function stubReviews(code: ReviewRequestCode) {
  if (code === 'unavailable') {
    delete window.shopify
    return
  }
  window.shopify = {
    reviews: {
      request: vi
        .fn()
        .mockResolvedValue(
          code === 'success' ? { success: true } : { success: false, code }
        ),
    },
  } as unknown as ShopifyGlobal
}

/** Whether an `em` width query holds on a 390px-wide phone. */
function matchesPhone(query: string): boolean {
  const width = 390 / 16
  return [...query.matchAll(/\((min|max)-width:\s*(-?[\d.]+)em\)/g)].every(
    ([, bound, value]) =>
      bound === 'min' ? width >= Number(value) : width <= Number(value)
  )
}

/** Polaris reads its breakpoints from matchMedia. */
function emulatePhone() {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: matchesPhone(query),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList
  )
}

describe('ReviewPromptCard', () => {
  beforeEach(() => {
    auth.api.get.mockReset()
    auth.api.post.mockReset()
    auth.api.post.mockResolvedValue({ outcome: 'recorded' })
  })

  afterEach(() => {
    delete window.shopify
    vi.restoreAllMocks()
  })

  it('shows nothing and records nothing when the store is not asked', async () => {
    setup({ ...RESULTS, visible: false })
    await waitFor(() => expect(auth.api.get).toHaveBeenCalled())
    expect(screen.queryByText(TITLE)).toBeNull()
    expect(screen.queryByText(FALLBACK_TITLE)).toBeNull()
    expect(auth.api.post).not.toHaveBeenCalled()
  })

  it('leads with both results, in Western digits, and records one view', async () => {
    const { container } = setup()
    await screen.findByText(TITLE)
    const numbers = [...container.querySelectorAll('bdi')].map(
      (node) => node.textContent
    )
    expect(numbers).toEqual(['42', '3'])
    // Arabic plural forms: 42 is "many", 3 is "few".
    expect(screen.getByText('طلبًا مؤكدًا')).toBeTruthy()
    expect(screen.getByText('طلبات أُلغيت قبل الشحن')).toBeTruthy()
    expect(screen.getByText(/^منذ 15 مارس/)).toBeTruthy()
    expect(screen.getByText(/ويمكنك كتابته بالعربية/)).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    await waitFor(() => expect(posted()).toEqual([{ action: 'shown' }]))
    expect(auth.api.post).toHaveBeenCalledWith('/api/review-prompt/actions', {
      action: 'shown',
    })
  })

  it('hides the canceled stat when nothing was canceled', async () => {
    const { container } = setup({ ...RESULTS, canceled: 0 })
    await screen.findByText(TITLE)
    expect(container.querySelectorAll('bdi')).toHaveLength(1)
    expect(screen.queryByText(/قبل الشحن/)).toBeNull()
  })

  it.each([
    ['below the threshold', { ...RESULTS, variant: 'fallback', confirmed: 9 }],
    [
      'without a count',
      { ...RESULTS, variant: 'fallback', confirmed: null, canceled: null },
    ],
  ] as const)('shows the plain request %s', async (_, view) => {
    const { container } = setup(view)
    await screen.findByText(FALLBACK_TITLE)
    expect(screen.queryByText(TITLE)).toBeNull()
    expect(container.querySelectorAll('bdi')).toHaveLength(0)
    expect(
      screen.getByText(
        'تقييم قصير على Shopify يساعد التجار الآخرين على الاختيار. يستغرق 30 ثانية.'
      )
    ).toBeTruthy()
  })

  it.each<[ReviewRequestCode, 'thanks' | 'keep' | 'hide' | 'ignore', boolean]>([
    ['success', 'thanks', false],
    ['already-reviewed', 'thanks', false],
    ['cooldown-period', 'thanks', true],
    ['annual-limit-reached', 'thanks', true],
    ['mobile-app', 'thanks', true],
    ['recently-installed', 'thanks', true],
    ['unavailable', 'thanks', true],
    ['cancelled', 'keep', false],
    ['merchant-ineligible', 'hide', false],
    ['already-open', 'ignore', false],
    ['open-in-progress', 'ignore', false],
  ])('%s: card %s, listing opened: %s', async (code, ui, opensListing) => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    stubReviews(code)
    setup()
    fireEvent.click(await screen.findByRole('button', { name: CTA }))

    await waitFor(() =>
      expect(posted()).toEqual([
        { action: 'shown' },
        { action: 'clicked' },
        { action: 'result', code },
      ])
    )
    if (opensListing) {
      expect(open).toHaveBeenCalledWith(
        SHOPIFY_APP_STORE_REVIEW_URL,
        '_blank',
        'noopener,noreferrer'
      )
    } else {
      expect(open).not.toHaveBeenCalled()
    }

    if (ui === 'thanks') {
      expect(await screen.findByText(THANKS)).toBeTruthy()
      expect(screen.queryByText(TITLE)).toBeNull()
      expect(screen.queryByRole('button')).toBeNull()
    } else if (ui === 'hide') {
      await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull())
      expect(screen.queryByText(THANKS)).toBeNull()
    } else {
      expect(screen.getByText(TITLE)).toBeTruthy()
      await waitFor(() =>
        expect(
          screen
            .getByRole('button', { name: LATER })
            .getAttribute('aria-disabled')
        ).not.toBe('true')
      )
    }
  })

  it('"Not now" records the answer and hides the card', async () => {
    setup()
    fireEvent.click(await screen.findByRole('button', { name: LATER }))
    expect(screen.queryByText(TITLE)).toBeNull()
    await waitFor(() =>
      expect(posted()).toEqual([{ action: 'shown' }, { action: 'not_now' }])
    )
  })

  it('stacks on a phone, primary first and full width', async () => {
    emulatePhone()
    setup()
    await screen.findByText(TITLE)
    await waitFor(() =>
      expect(screen.queryByText(/ويمكنك كتابته بالعربية/)).toBeNull()
    )
    expect(
      screen.getByText(
        'إن كان أكيد مفيدًا لك، ساعد التجار الآخرين بتقييم قصير على Shopify. يستغرق 30 ثانية.'
      )
    ).toBeTruthy()
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual([CTA, LATER])
    for (const button of buttons) {
      expect(button.className).toMatch(/fullWidth/)
    }
  })
})
