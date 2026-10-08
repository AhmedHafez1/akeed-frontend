import { createRef } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { EasyOrdersDetailsStep } from './EasyOrdersDetailsStep'
import type { EasyOrdersConnectionDetails } from './easyOrders.types'

const STORED: EasyOrdersConnectionDetails = {
  storeId: 'store-7f3a',
  storeVerified: true,
  health: 'ok',
  webhookUrlHint: 'aB3_xZ',
  ordersSecretSet: true,
  statusSecretSet: true,
  currency: 'EGP',
  phoneCountry: 'EG',
  rejectedDeliveries: 0,
  connectedAt: '2026-10-03T10:00:00.000Z',
  disconnectedAt: null,
}

function renderStep(
  connection: Partial<EasyOrdersConnectionDetails> = {},
  props: { canManage?: boolean; isSaving?: boolean } = {}
) {
  const handlers = {
    onSaveSettings: vi.fn().mockResolvedValue(true),
    onSaveSecrets: vi.fn().mockResolvedValue(true),
    onContinue: vi.fn(),
  }
  renderOnboardingStandalone(
    <EasyOrdersDetailsStep
      connection={{ ...STORED, ...connection }}
      canManage={props.canManage ?? true}
      isSaving={props.isSaving ?? false}
      settingsFailed={false}
      secretsFailed={false}
      lead={null}
      headingRef={createRef<HTMLHeadingElement>()}
      {...handlers}
    />,
    'en'
  )
  return handlers
}

const field = (id: string) =>
  document.getElementById(id) as HTMLInputElement | HTMLSelectElement
const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }))

describe('EasyOrdersDetailsStep', () => {
  it('continues without saving anything when nothing was changed', async () => {
    const handlers = renderStep()

    expect(
      screen.getByText(
        'Your webhook secrets are saved. Leave these two fields empty to keep them.'
      )
    ).toBeTruthy()
    submit()

    await waitFor(() => expect(handlers.onContinue).toHaveBeenCalledTimes(1))
    expect(handlers.onSaveSettings).not.toHaveBeenCalled()
    expect(handlers.onSaveSecrets).not.toHaveBeenCalled()
  })

  it('saves only the part that changed', async () => {
    const handlers = renderStep()

    fireEvent.change(field('easyorders-currency'), { target: { value: 'USD' } })
    submit()

    await waitFor(() => expect(handlers.onContinue).toHaveBeenCalledTimes(1))
    expect(handlers.onSaveSettings).toHaveBeenCalledWith({
      currency: 'USD',
      phoneCountry: 'EG',
    })
    expect(handlers.onSaveSecrets).not.toHaveBeenCalled()
  })

  it('asks for both secrets once the merchant starts replacing one', async () => {
    const handlers = renderStep()

    fireEvent.change(field('easyorders-orders-secret'), {
      target: { value: 'ORDERS-secret-01' },
    })
    submit()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Paste both secrets.'
    )
    expect(document.activeElement).toBe(field('easyorders-status-secret'))
    expect(handlers.onSaveSecrets).not.toHaveBeenCalled()
    expect(handlers.onContinue).not.toHaveBeenCalled()
  })

  it('asks for the country and currency before looking at the secrets', async () => {
    const handlers = renderStep({
      currency: null,
      phoneCountry: null,
      ordersSecretSet: false,
      statusSecretSet: false,
    })

    submit()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Choose a country and a currency.'
    )
    expect(document.activeElement).toBe(field('easyorders-phone-country'))
    expect(handlers.onSaveSettings).not.toHaveBeenCalled()
  })

  it('stays on the step when a save fails', async () => {
    const handlers = renderStep({ ordersSecretSet: false })
    handlers.onSaveSecrets.mockResolvedValue(false)

    fireEvent.change(field('easyorders-orders-secret'), {
      target: { value: 'ORDERS-secret-01' },
    })
    fireEvent.change(field('easyorders-status-secret'), {
      target: { value: 'STATUS-secret-02' },
    })
    submit()

    await waitFor(() => expect(handlers.onSaveSecrets).toHaveBeenCalledTimes(1))
    expect(handlers.onContinue).not.toHaveBeenCalled()
    // What was typed is still there to send again.
    expect(field('easyorders-orders-secret').value).toBe('ORDERS-secret-01')
  })

  it('is read-only for a viewer', () => {
    const handlers = renderStep({}, { canManage: false })

    expect(field('easyorders-phone-country').disabled).toBe(true)
    expect(field('easyorders-orders-secret').disabled).toBe(true)
    expect(
      (
        screen.getByRole('button', {
          name: 'Save and continue',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(handlers.onContinue).not.toHaveBeenCalled()
  })
})
