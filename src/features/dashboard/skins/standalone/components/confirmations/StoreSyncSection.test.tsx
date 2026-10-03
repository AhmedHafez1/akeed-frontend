import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import type { RemoteSync } from '@/shared/types/commerce-outcome.model'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { renderStandalone } from '../shared/standaloneTestUtils'
import { StatusCell } from './confirmationCells'
import { VerificationDetailsSheet } from './VerificationDetailsSheet'

function sync(overrides: Partial<RemoteSync> = {}): RemoteSync {
  return {
    state: 'failed',
    action: 'customer_confirmation',
    error_code: 'source_unavailable',
    requires_assistance: false,
    retryable: true,
    updated_at: '2026-10-03T10:05:00Z',
    ...overrides,
  }
}

function verification(
  overrides: Partial<VerificationItem> = {}
): VerificationItem {
  return {
    id: 'ver-1',
    order_id: 'order-1',
    order_number: '1150',
    customer_name: 'Test Customer',
    customer_phone: '+201000000000',
    total_price: '750.00',
    currency: 'EGP',
    status: 'confirmed',
    reason: null,
    created_at: '2026-10-03T10:00:00Z',
    confirmed_at: '2026-10-03T10:04:00Z',
    follow_up_sent_at: null,
    platform: 'easyorders',
    remote_sync: sync(),
    ...overrides,
  } as VerificationItem
}

function renderSheet(
  item: VerificationItem,
  lang: 'ar' | 'en',
  props: { canRetrySync?: boolean; retryingSyncId?: string | null } = {}
) {
  const onRetrySync = vi.fn()
  renderStandalone(
    <VerificationDetailsSheet
      verification={item}
      timeZone="UTC"
      onClose={vi.fn()}
      canRetrySync={props.canRetrySync ?? true}
      retryingSyncId={props.retryingSyncId ?? null}
      onRetrySync={onRetrySync}
    />,
    lang
  )
  return { onRetrySync }
}

describe('store update in the details sheet', () => {
  it('shows a failed store update next to the confirmed result, not instead of it', () => {
    renderSheet(verification(), 'en')

    // The local result is still the confirmation.
    expect(screen.getAllByText(/confirm/i).length).toBeGreaterThan(0)
    const section = screen.getByRole('region', { name: 'Store update' })
    expect(section.textContent).toContain('Not updated in your store')
    expect(section.textContent).toContain(
      "We could not update this order in your store. Try again, or change the order's status in your store yourself."
    )
    expect(section.textContent).toContain('saved in Akeed either way')
    expect(section.textContent).not.toContain('source_unavailable')
  })

  it('retries from the sheet for the row it shows', () => {
    const item = verification()
    const { onRetrySync } = renderSheet(item, 'en')

    fireEvent.click(
      screen.getByRole('button', { name: 'Try the store update again' })
    )

    expect(onRetrySync).toHaveBeenCalledWith(item)
  })

  it('offers no retry to a viewer', () => {
    renderSheet(verification(), 'en', { canRetrySync: false })

    expect(screen.queryByRole('button', { name: /store update/i })).toBeNull()
    expect(screen.getByText('Not updated in your store')).toBeTruthy()
  })

  it('disables the button while the retry runs', () => {
    renderSheet(verification(), 'en', { retryingSyncId: 'ver-1' })

    expect(
      screen
        .getByRole('button', { name: 'Updating your store...' })
        .hasAttribute('disabled')
    ).toBe(true)
  })

  it.each([
    [
      'en',
      sync({ state: 'pending', retryable: false }),
      'We are still trying to update this order in your store. There is nothing you need to do yet.',
    ],
    [
      'ar',
      sync({ state: 'pending', retryable: false }),
      'ما زلنا نحاول تحديث هذا الطلب في متجرك. لا يلزمك فعل شيء الآن.',
    ],
    [
      'en',
      sync({
        error_code: 'source_credentials_rejected',
        requires_assistance: true,
      }),
      "Your store did not accept Akeed's access. Check the store connection, then try again.",
    ],
    [
      'ar',
      sync({ error_code: 'remote_state_conflict', retryable: true }),
      'كان هذا الطلب قد انتقل إلى حالة أخرى في متجرك، فتركناه كما هو. غيّره من متجرك إن لزم.',
    ],
    [
      'ar',
      sync({
        state: 'unsupported',
        action: 'automatic_no_reply_tagging',
        error_code: 'capability_not_supported',
        retryable: false,
      }),
      'لم يرد العميل. هذا مسجَّل في أكيد فقط: الطلب في متجرك لم يتغير ولم يُلغَ.',
    ],
  ] as const)(
    'gives localized guidance in %s (%#)',
    (lang, remote, sentence) => {
      renderSheet(verification({ remote_sync: remote }), lang)

      expect(screen.getByText(sentence)).toBeTruthy()
    }
  )

  it('offers no retry while the update is pending or was never sent', () => {
    renderSheet(
      verification({
        remote_sync: sync({ state: 'pending', retryable: false }),
      }),
      'en'
    )

    expect(screen.queryByRole('button', { name: /store update/i })).toBeNull()
  })

  it('says nothing for a source that reports no sync', () => {
    renderSheet(verification({ platform: 'shopify', remote_sync: null }), 'en')

    expect(screen.queryByRole('region', { name: 'Store update' })).toBeNull()
  })
})

describe('store update on the row', () => {
  it('keeps the local badge and adds a line for a failed update', () => {
    renderStandalone(<StatusCell row={verification()} timeZone="UTC" />, 'en')

    expect(screen.getByText('Confirmed')).toBeTruthy()
    expect(screen.getByText('Store not updated')).toBeTruthy()
  })

  it('adds a line in Arabic while the update is pending', () => {
    renderStandalone(
      <StatusCell
        row={verification({
          remote_sync: sync({ state: 'pending', retryable: false }),
        })}
        timeZone="UTC"
      />,
      'ar'
    )

    expect(screen.getByText('جارٍ تحديث متجرك')).toBeTruthy()
  })

  it.each([
    ['a store that has the result', sync({ state: 'succeeded' })],
    ['a result that was never sent', sync({ state: 'unsupported' })],
    ['a source without sync', null],
  ])('adds no line for %s', (_name, remote) => {
    renderStandalone(
      <StatusCell row={verification({ remote_sync: remote })} timeZone="UTC" />,
      'en'
    )

    expect(screen.queryByText(/store/i)).toBeNull()
  })
})
