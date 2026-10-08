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
  ordersSecretSet: false,
  statusSecretSet: false,
  currency: 'EGP',
  phoneCountry: 'EG',
  rejectedDeliveries: 0,
  connectedAt: '2026-10-03T10:00:00.000Z',
  disconnectedAt: null,
  providerCleanup: null,
}

function renderStep(
  connection: Partial<EasyOrdersConnectionDetails> = {},
  props: { canManage?: boolean; settingsFailed?: boolean } = {}
) {
  const handlers = {
    onSaveSettings: vi.fn().mockResolvedValue(true),
    onContinue: vi.fn(),
  }
  renderOnboardingStandalone(
    <EasyOrdersDetailsStep
      connection={{ ...STORED, ...connection }}
      canManage={props.canManage ?? true}
      isSaving={false}
      settingsFailed={props.settingsFailed ?? false}
      lead={null}
      headingRef={createRef<HTMLHeadingElement>()}
      {...handlers}
    />,
    'en'
  )
  return handlers
}

const field = (id: string) => document.getElementById(id) as HTMLSelectElement
const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }))

describe('EasyOrdersDetailsStep', () => {
  it('asks for no webhook secret, and says Akeed secures the webhooks itself', () => {
    renderStep()

    expect(document.querySelector('input[type="password"]')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Nothing to copy from EasyOrders' })
    ).toBeTruthy()
    expect(document.body.textContent).toContain(
      'Akeed secures your webhooks by itself.'
    )
    expect(document.body.textContent).not.toContain('Paste')
  })

  it('continues without saving anything when nothing was changed', async () => {
    const handlers = renderStep()

    submit()

    await waitFor(() => expect(handlers.onContinue).toHaveBeenCalledTimes(1))
    expect(handlers.onSaveSettings).not.toHaveBeenCalled()
  })

  it('saves a changed currency, then continues', async () => {
    const handlers = renderStep()

    fireEvent.change(field('easyorders-currency'), { target: { value: 'USD' } })
    submit()

    await waitFor(() => expect(handlers.onContinue).toHaveBeenCalledTimes(1))
    expect(handlers.onSaveSettings).toHaveBeenCalledWith({
      currency: 'USD',
      phoneCountry: 'EG',
    })
  })

  it('asks for the country and currency before saving', async () => {
    const handlers = renderStep({ currency: null, phoneCountry: null })

    submit()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Choose a country and a currency.'
    )
    expect(document.activeElement).toBe(field('easyorders-phone-country'))
    expect(handlers.onSaveSettings).not.toHaveBeenCalled()
  })

  it('stays on the step when a save fails', async () => {
    const handlers = renderStep()
    handlers.onSaveSettings.mockResolvedValue(false)

    fireEvent.change(field('easyorders-currency'), { target: { value: 'USD' } })
    submit()

    await waitFor(() =>
      expect(handlers.onSaveSettings).toHaveBeenCalledTimes(1)
    )
    expect(handlers.onContinue).not.toHaveBeenCalled()
    // What was chosen is still there to send again.
    expect(field('easyorders-currency').value).toBe('USD')
  })

  it('is read-only for a viewer', () => {
    const handlers = renderStep({}, { canManage: false })

    expect(field('easyorders-phone-country').disabled).toBe(true)
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
