import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AdminStoreVerification } from './admin.model'
import { AdminApiError } from './adminApi'
import { VerificationResendAction } from './VerificationResendAction'

const api = vi.hoisted(() => ({ resend: vi.fn() }))
vi.mock('./adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./adminApi')>()),
  resendAdminDispatch: api.resend,
}))

function verification(
  overrides: Partial<AdminStoreVerification> = {}
): AdminStoreVerification {
  return {
    id: 'ver-1',
    status: 'failed',
    reason: 'provider_outcome_unknown',
    failure_code: null,
    failure_title: null,
    order_number: '3141',
    external_order_id: '6580956037477',
    is_test: false,
    customer_name: 'Customer',
    customer_phone_masked: '+2011•••••410',
    customer_country: 'EG',
    total_price: '2300.00',
    currency: 'EGP',
    attempts: 0,
    follow_up_attempts: 0,
    resend_dispatch_id: 'dispatch-1',
    template_name: null,
    language_code: null,
    cancellation_source: null,
    created_at: '2026-11-09T17:29:00Z',
    updated_at: null,
    last_sent_at: null,
    delivered_at: null,
    read_at: null,
    confirmed_at: null,
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_sent_at: null,
    ...overrides,
  }
}

const openDialog = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'Mark not sent and resend' })
  )
const confirm = () =>
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Mark not sent and resend' }).at(-1)!
  )

describe('VerificationResendAction', () => {
  beforeEach(() => {
    api.resend.mockReset()
  })

  it.each([null, undefined])(
    'offers nothing without a resendable message (%s)',
    (resendDispatchId) => {
      render(
        <VerificationResendAction
          verification={verification({ resend_dispatch_id: resendDispatchId })}
          onResent={vi.fn()}
        />
      )
      expect(screen.queryByRole('button')).toBeNull()
    }
  )

  it('confirms, resends with the audit reason, then refreshes on close', async () => {
    api.resend.mockResolvedValue({
      dispatchId: 'dispatch-1',
      state: 'rejected',
      retry: { orderId: 'order-1', duplicate: false },
    })
    const onResent = vi.fn()
    render(
      <VerificationResendAction
        verification={verification()}
        onResent={onResent}
      />
    )

    openDialog()
    expect(
      screen.getByText(/the customer will get it twice/i, { exact: false })
    ).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: '  Refused locally before the provider call  ' },
    })
    confirm()

    await screen.findByText(/queued for resending/)
    expect(api.resend).toHaveBeenCalledWith(
      'dispatch-1',
      'Refused locally before the provider call'
    )
    expect(onResent).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(onResent).toHaveBeenCalledTimes(1))
  })

  it('does not send without a reason', () => {
    render(
      <VerificationResendAction
        verification={verification()}
        onResent={vi.fn()}
      />
    )
    openDialog()
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: '   ' },
    })
    expect(
      screen.getAllByRole('button', { name: 'Mark not sent and resend' }).at(-1)
    ).toHaveProperty('disabled', true)
  })

  it('explains a resend the store was not ready for', async () => {
    api.resend.mockRejectedValue(
      new AdminApiError(
        'The Standalone source is not ready for verification.',
        409,
        'req-1',
        'MANUAL_ORDER_RETRY_BLOCKED'
      )
    )
    const onResent = vi.fn()
    render(
      <VerificationResendAction
        verification={verification()}
        onResent={onResent}
      />
    )

    openDialog()
    confirm()

    expect((await screen.findByRole('alert')).textContent).toMatch(
      /marked not sent, but the resend was refused/
    )
    expect(screen.getByText(/req-1/)).toBeTruthy()
    expect(onResent).not.toHaveBeenCalled()
  })
})
