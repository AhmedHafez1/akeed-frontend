import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ConnectionLine, type ConnectionLineState } from './ConnectionLine'

const STATES: ConnectionLineState[] = [
  'idle',
  'waiting',
  'connected',
  'refused',
  'disconnected',
]

describe('ConnectionLine', () => {
  it.each([
    ['idle', 'Akeed and Noor Store are not connected yet.'],
    ['waiting', 'Akeed is connecting to Noor Store.'],
    ['connected', 'Akeed is connected to Noor Store.'],
    ['refused', 'Akeed could not connect to Noor Store.'],
    ['disconnected', 'Akeed is disconnected from Noor Store.'],
  ] as const)('says the %s state once, as a sentence', (state, sentence) => {
    const { container } = renderOnboardingStandalone(
      <ConnectionLine state={state} store="Noor Store" />,
      'en'
    )

    expect(screen.getByText(sentence).className).toContain('sr-only')
    // The drawing itself is not read out a second time.
    expect(
      container.querySelector('[aria-hidden="true"]')?.textContent
    ).toContain('Noor Store')
  })

  it('calls an unnamed store "your store", in the reader\'s language', () => {
    renderOnboardingStandalone(<ConnectionLine state="idle" store={null} />)

    expect(screen.getByText('متجرك')).toBeTruthy()
    expect(screen.getByText('أكيد ومتجرك غير متصلين بعد.')).toBeTruthy()
  })

  it('keeps an address left to right in Arabic, and a name as text', () => {
    const { unmount } = renderOnboardingStandalone(
      <ConnectionLine
        state="connected"
        store="shop.example.com/eg"
        storeIsAddress
      />
    )
    expect(
      screen
        .getByText('shop.example.com/eg')
        .closest('bdi')
        ?.getAttribute('dir')
    ).toBe('ltr')

    unmount()

    renderOnboardingStandalone(
      <ConnectionLine state="connected" store="متجر نور" />
    )
    expect(screen.getByText('متجر نور').closest('bdi')).toBeNull()
  })

  it('animates only for readers who have not asked for less motion', () => {
    for (const state of STATES) {
      const { container, unmount } = renderOnboardingStandalone(
        <ConnectionLine state={state} store="Noor Store" />,
        'en'
      )
      const animated = [...container.querySelectorAll('[class*="animate-"]')]

      for (const element of animated)
        expect(element.className).toMatch(/motion-safe:animate-/)
      unmount()
    }
  })

  it('has every state in both languages', () => {
    for (const messages of [ar, en])
      expect(Object.keys(messages.connectionLine.label).sort()).toEqual(
        [...STATES].sort()
      )
  })
})
