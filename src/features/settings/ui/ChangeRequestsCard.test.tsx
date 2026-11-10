import { AppProvider } from '@shopify/polaris'
import polaris from '@shopify/polaris/locales/en.json'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../../public/messages/en.json'
import { ChangeRequestsCard as Embedded } from '@/features/settings/skins/embedded/settings-page/ChangeRequestsCard'
import { ChangeRequestsCard as Standalone } from '@/features/settings/skins/standalone/settings-page/ChangeRequestsCard'

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(
    document.body
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe.each([
  ['embedded', Embedded, 'checkbox', en.settings.changeRequests.noteAckPlan],
  ['standalone', Standalone, 'switch', en.settings.changeRequests.noteAck],
] as const)('%s compact change requests', (_skin, Component, role, cost) => {
  it('shows the description and puts only acknowledgment usage in help', async () => {
    const onChange = vi.fn()
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <AppProvider i18n={polaris}>
          <Component checked ready onChange={onChange} readOnly />
        </AppProvider>
      </NextIntlClientProvider>
    )
    expect(
      screen.getByText(en.settings.changeRequests.description)
    ).toBeTruthy()
    expect(screen.queryByText(cost)).toBeNull()
    expect((screen.getByRole(role) as HTMLInputElement).disabled).toBe(true)
    fireEvent.click(
      screen.getByRole('button', { name: en.settings.changeRequests.heading })
    )
    expect((await screen.findByRole('tooltip')).textContent).toBe(cost)
    expect(screen.queryByText(/new messages only/i)).toBeNull()
    expect(screen.queryByText(/fulfillment hold/i)).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('keeps readiness and branding notices visible without opening help', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <AppProvider i18n={polaris}>
          <Component
            checked={false}
            ready={false}
            onChange={() => {}}
            readOnly={false}
            variants={[
              {
                ready: false,
                reason: 'logo_banner_unavailable',
                branding_supported: false,
              },
            ]}
          />
        </AppProvider>
      </NextIntlClientProvider>
    )
    expect(
      screen.getByText(en.settings.changeRequests.brandingUnavailable)
    ).toBeTruthy()
    expect(
      screen.getByText(en.settings.changeRequests.ownNumberText)
    ).toBeTruthy()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
