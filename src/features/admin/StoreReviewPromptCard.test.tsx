import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AdminStoreReviewPrompt } from './admin.model'
import { StoreReviewPromptCard } from './StoreReviewPromptCard'

const auth = vi.hoisted(() => ({ fetchWithAuth: vi.fn() }))

vi.mock('@/shared/lib/auth', () => auth)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function prompt(
  overrides: Partial<AdminStoreReviewPrompt> = {}
): AdminStoreReviewPrompt {
  return {
    enabled: false,
    request_id: null,
    enabled_at: null,
    enabled_by: null,
    opted_out: false,
    opted_out_at: null,
    last_event: null,
    events: [],
    ...overrides,
  }
}

const reviewSwitch = () =>
  screen.getByRole('switch', { name: 'Review Prompt Enabled' })

describe('StoreReviewPromptCard', () => {
  beforeEach(() => auth.fetchWithAuth.mockReset())

  it('turns the request on through the PATCH endpoint', async () => {
    const enabled = prompt({
      enabled: true,
      request_id: 'req-1',
      enabled_at: '2026-10-19T09:00:00Z',
      enabled_by: 'staff@akeed.test',
      last_event: {
        event: 'enabled',
        actor_type: 'admin',
        at: '2026-10-19T09:00:00Z',
      },
      events: [
        {
          id: 'e-1',
          request_id: 'req-1',
          event: 'enabled',
          actor_type: 'admin',
          actor_id: 'staff-1',
          at: '2026-10-19T09:00:00Z',
        },
      ],
    })
    auth.fetchWithAuth.mockResolvedValue(json(200, { review_prompt: enabled }))
    render(<StoreReviewPromptCard integrationId="int 1" initial={prompt()} />)
    expect(screen.getByText('Off')).toBeTruthy()

    fireEvent.click(reviewSwitch())

    await waitFor(() =>
      expect(reviewSwitch().getAttribute('aria-checked')).toBe('true')
    )
    const [url, init] = auth.fetchWithAuth.mock.calls[0]
    expect(url).toBe('/api/admin/stores/int%201/review-prompt')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ enabled: true })
    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByText(/Turned on by admin/)).toBeTruthy()
  })

  it('locks the switch and says why once the merchant opted out', () => {
    render(
      <StoreReviewPromptCard
        integrationId="int-1"
        initial={prompt({
          opted_out: true,
          opted_out_at: '2026-10-18T12:00:00Z',
        })}
      />
    )
    expect(reviewSwitch().hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('Opted out')).toBeTruthy()
    expect(screen.getByText(/That choice is final/)).toBeTruthy()
    fireEvent.click(reviewSwitch())
    expect(auth.fetchWithAuth).not.toHaveBeenCalled()
  })

  it('locks the switch when the backend reports an opt-out', async () => {
    auth.fetchWithAuth.mockResolvedValue(
      json(409, { message: 'Opted out', code: 'REVIEW_PROMPT_OPTED_OUT' })
    )
    render(<StoreReviewPromptCard integrationId="int-1" initial={prompt()} />)
    fireEvent.click(reviewSwitch())
    await waitFor(() =>
      expect(reviewSwitch().hasAttribute('disabled')).toBe(true)
    )
    expect(screen.getByText('Opted out')).toBeTruthy()
  })
})
