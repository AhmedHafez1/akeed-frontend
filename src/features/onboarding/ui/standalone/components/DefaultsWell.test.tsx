import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DefaultsWell, type DefaultsWellRow } from './DefaultsWell'
import { renderOnboardingStandalone } from './onboardingTestUtils'

function makeRows(): DefaultsWellRow[] {
  return [
    {
      id: 'currency',
      label: 'Currency',
      valueLabel: 'EGP',
      control: <div>Currency control</div>,
    },
    {
      id: 'timezone',
      label: 'Timezone',
      valueLabel: 'Africa/Cairo',
      control: <div>Timezone control</div>,
    },
  ]
}

describe('DefaultsWell', () => {
  it('renders each row label and value', () => {
    renderOnboardingStandalone(
      <DefaultsWell rows={makeRows()} caption="You can change these anytime" />
    )
    expect(screen.getByText('Currency')).toBeTruthy()
    expect(screen.getByText('EGP')).toBeTruthy()
    expect(screen.getByText('Timezone')).toBeTruthy()
    expect(screen.getByText('Africa/Cairo')).toBeTruthy()
  })

  it('renders the caption', () => {
    renderOnboardingStandalone(
      <DefaultsWell rows={makeRows()} caption="You can change these anytime" />
    )
    expect(screen.getByText('You can change these anytime')).toBeTruthy()
  })

  it('expands only the clicked row and toggles aria-expanded', () => {
    renderOnboardingStandalone(
      <DefaultsWell rows={makeRows()} caption="caption" />
    )

    expect(screen.queryByText('Currency control')).toBeNull()
    expect(screen.queryByText('Timezone control')).toBeNull()

    const changeButtons = screen.getAllByRole('button')
    fireEvent.click(changeButtons[0])

    expect(screen.getByText('Currency control')).toBeTruthy()
    expect(screen.queryByText('Timezone control')).toBeNull()
    expect(changeButtons[0].getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(changeButtons[1])

    expect(screen.queryByText('Currency control')).toBeNull()
    expect(screen.getByText('Timezone control')).toBeTruthy()
    expect(changeButtons[0].getAttribute('aria-expanded')).toBe('false')
    expect(changeButtons[1].getAttribute('aria-expanded')).toBe('true')
  })
})
