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
    const tooltip = await screen.findByRole('tooltip')
    if (_skin === 'embedded') expect(tooltip.textContent).toBe(cost)
    else expect(tooltip.textContent).toContain(cost)
    expect(screen.queryByText(/new messages only/i)).toBeNull()
    expect(screen.queryByText(/fulfillment hold/i)).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('is disabled with a hover hint when the selected style has no change-request template', async () => {
    const onChange = vi.fn()
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <AppProvider i18n={polaris}>
          <Component
            checked={false}
            ready
            styleReady={false}
            onChange={onChange}
            readOnly={false}
          />
        </AppProvider>
      </NextIntlClientProvider>
    )
    const control = screen.getByRole(role) as HTMLInputElement
    expect(control.disabled).toBe(true)
    expect(
      screen.queryByText(en.settings.changeRequests.styleUnavailable)
    ).toBeNull()
    fireEvent.mouseOver(control)
    fireEvent.mouseEnter(control.closest('span[tabindex]') ?? control)
    fireEvent.focus(control.closest('span[tabindex]') ?? control)
    expect(
      await screen.findByText(en.settings.changeRequests.styleUnavailable)
    ).toBeTruthy()
    fireEvent.click(control)
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
    // Standalone keeps the own-number note behind the help icon.
    expect(
      screen.queryAllByText(en.settings.changeRequests.ownNumberText)
    ).toHaveLength(_skin === 'embedded' ? 1 : 0)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
