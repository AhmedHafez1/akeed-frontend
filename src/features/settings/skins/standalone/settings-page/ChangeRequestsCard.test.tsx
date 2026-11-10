import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'
import en from '../../../../../../public/messages/en.json'
import {
  formFromSettings,
  toSettingsPayload,
} from '@/features/settings/domain/settingsForm'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import { ChangeRequestsCard } from './ChangeRequestsCard'

function renderCard(props: Partial<Parameters<typeof ChangeRequestsCard>[0]>) {
  const onChange = vi.fn()
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <ChangeRequestsCard
        checked={false}
        ready
        onChange={onChange}
        readOnly={false}
        {...props}
      />
    </NextIntlClientProvider>
  )
  return { onChange, toggle: screen.getByRole('switch') as HTMLButtonElement }
}

describe('ChangeRequestsCard', () => {
  it('is off by default and can be turned on when the messages are ready', () => {
    const { onChange, toggle } = renderCard({})
    expect(screen.getByText('Off')).toBeTruthy()
    expect(toggle.disabled).toBe(false)
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
    expect(screen.queryByText(en.settings.changeRequests.noteAck)).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: en.settings.changeRequests.heading })
    )
    expect(
      screen.getByText('Akeed replies once to confirm receipt (1 message).')
    ).toBeTruthy()
  })

  it('cannot be turned on while the messages are not ready, and says so', () => {
    const { toggle } = renderCard({ ready: false })
    expect(toggle.disabled).toBe(true)
    expect(screen.getByText('Not available yet. Try again later.')).toBeTruthy()
  })

  it('can still be turned off when it is on and no longer ready', () => {
    const { onChange, toggle } = renderCard({ checked: true, ready: false })
    expect(toggle.disabled).toBe(false)
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('is read-only for a viewer', () => {
    const { toggle } = renderCard({ readOnly: true })
    expect(toggle.disabled).toBe(true)
  })
})

describe('settings form and change requests', () => {
  const template = {
    selected: { ar: null, en: null, ur: null, es: null, fr: null, tr: null },
  } as unknown as SettingsResponse['template']
  const state = {
    storeName: 'Store',
    defaultLanguage: 'ar',
    isAutoVerifyEnabled: true,
    sendDelayMinutes: 0,
    followUpEnabled: false,
    followUpDelayMinutes: 60,
    escalationEnabled: false,
    escalationDelayMinutes: 720,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Africa/Cairo',
    assumeCodWhenPaymentMissing: false,
  } as unknown as SettingsResponse['state']

  it('sends the switch only when the backend offers it', () => {
    expect(
      'changeRequestsEnabled' in
        toSettingsPayload(formFromSettings(state, template))
    ).toBe(false)
    const values = formFromSettings(
      { ...state, changeRequestsEnabled: false },
      template
    )
    expect(values.changeRequestsEnabled).toBe(false)
    expect(
      toSettingsPayload({ ...values, changeRequestsEnabled: true })
        .changeRequestsEnabled
    ).toBe(true)
  })
})
