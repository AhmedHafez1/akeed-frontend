import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/http'
import { SHOPIFY_APP_STORE_REVIEW_URL } from '@/shared/lib/shopify-auth'
import { queryKeys } from '@/shared/query/keys'
import type { ReviewPromptEnvelope } from '../../../model/reviewPrompt.model'
import { ReviewPromptBanner } from './ReviewPromptBanner'
import { renderEmbedded } from './embeddedTestUtils'

const auth = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  fetchWithAuth: vi.fn(),
}))

// The transport under the review calls: no request leaves the test.
vi.mock('@/shared/lib/auth', () => auth)

const TITLE = "How's Akeed working for your store?"

function setup(prompt: ReviewPromptEnvelope['prompt'] = { id: 'rp-1' }) {
  auth.api.get.mockResolvedValue({ prompt })
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  renderEmbedded(
    <QueryClientProvider client={client}>
      <ReviewPromptBanner />
    </QueryClientProvider>,
    'en'
  )
  return client
}

const impressionCalls = () =>
  auth.fetchWithAuth.mock.calls.filter(([url]) =>
    String(url).endsWith('/impressions')
  )

describe('ReviewPromptBanner', () => {
  beforeEach(() => {
    auth.api.get.mockReset()
    auth.api.post.mockReset()
    auth.fetchWithAuth.mockReset()
    auth.fetchWithAuth.mockResolvedValue(new Response(null, { status: 204 }))
    auth.api.post.mockResolvedValue({ outcome: 'recorded' })
  })

  it('shows nothing when no request is waiting', async () => {
    setup(null)
    await waitFor(() => expect(auth.api.get).toHaveBeenCalled())
    expect(screen.queryByText(TITLE)).toBeNull()
    expect(impressionCalls()).toHaveLength(0)
  })

  it('records that it was shown once per request', async () => {
    const client = setup()
    await screen.findByText(TITLE)
    await waitFor(() => expect(impressionCalls()).toHaveLength(1))
    expect(impressionCalls()[0]).toEqual([
      '/api/review-prompt/rp-1/impressions',
      { method: 'POST' },
    ])

    // A re-read of the same request is not a second impression.
    await client.refetchQueries({ queryKey: queryKeys.reviewPrompt.state() })
    await screen.findByText(TITLE)
    expect(impressionCalls()).toHaveLength(1)
  })

  it.each([
    ['Write a review', 'review_clicked'],
    ['Not now', 'snoozed'],
    ["Don't ask again", 'dont_ask_again'],
  ])('"%s" records %s and hides the banner', async (label, action) => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    setup()
    fireEvent.click(await screen.findByRole('button', { name: label }))
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull())
    expect(auth.api.post).toHaveBeenCalledWith(
      '/api/review-prompt/rp-1/actions',
      { action }
    )
  })

  it('the close button records dismissed and hides the banner', async () => {
    setup()
    await screen.findByText(TITLE)
    // Polaris labels the banner's close button itself.
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull())
    expect(auth.api.post).toHaveBeenCalledWith(
      '/api/review-prompt/rp-1/actions',
      { action: 'dismissed' }
    )
  })

  it('opens the review page in a new tab from the click', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    // The answer is still saving when the tab opens.
    auth.api.post.mockReturnValue(new Promise(() => {}))
    setup()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Write a review' })
    )
    expect(open).toHaveBeenCalledWith(
      SHOPIFY_APP_STORE_REVIEW_URL,
      '_blank',
      'noopener,noreferrer'
    )
    expect(SHOPIFY_APP_STORE_REVIEW_URL).toBe(
      'https://apps.shopify.com/akeed#modal-show=WriteReviewModal'
    )
    // While saving, no second answer can start. Polaris marks a disabled
    // button with aria-disabled rather than the attribute.
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Not now' })
          .getAttribute('aria-disabled')
      ).toBe('true')
    )
  })

  it('keeps the banner and offers a retry when saving fails', async () => {
    auth.api.post.mockRejectedValueOnce(
      new ApiError('Unavailable', 503, 'REVIEW_PROMPT_UNAVAILABLE')
    )
    setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))
    expect(
      await screen.findByText("We couldn't save your answer. Please try again.")
    ).toBeTruthy()
    expect(screen.getByText(TITLE)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull())
    expect(auth.api.post).toHaveBeenCalledTimes(2)
  })

  it('hides when the server says the request is already closed', async () => {
    auth.api.post.mockRejectedValueOnce(
      new ApiError('Closed', 409, 'REVIEW_PROMPT_NOT_PENDING')
    )
    setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull())
  })
})
