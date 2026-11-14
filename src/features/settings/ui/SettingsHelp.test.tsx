import { AppProvider } from '@shopify/polaris'
import polaris from '@shopify/polaris/locales/en.json'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsHelp as Embedded } from '@/features/settings/skins/embedded/settings-page/SettingsHelp'
import { InfoHint as Standalone } from '@/shared/ui/info-hint'

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
  ['embedded', Embedded],
  ['standalone', Standalone],
] as const)('%s settings help', (_skin, Component) => {
  function setup() {
    const changed = vi.fn()
    render(
      <AppProvider i18n={polaris}>
        <form onSubmit={changed}>
          <Component
            label="Message details"
            rich
            content={
              <div>
                <p>Cost details</p>
                <p dir="rtl" lang="ar">
                  رسالة تجريبية
                </p>
              </div>
            }
          />
          <input aria-label="Outside" />
        </form>
      </AppProvider>
    )
    return {
      trigger: screen.getByRole('button', { name: 'Message details' }),
      changed,
    }
  }
  it('opens rich help on click, preserves direction, and never submits the form', async () => {
    const { trigger, changed } = setup()
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.click(trigger)
    const panel = await screen.findByRole('tooltip')
    expect(trigger.getAttribute('aria-describedby')).toBe(panel.id)
    expect(screen.getByText('رسالة تجريبية').getAttribute('dir')).toBe('rtl')
    expect(changed).not.toHaveBeenCalled()
    fireEvent.pointerDown(screen.getByRole('textbox'))
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    expect(trigger.hasAttribute('aria-describedby')).toBe(false)
  })
  it('keeps the panel open while hovered and dismisses it with Escape', async () => {
    const { trigger } = setup()
    fireEvent.mouseEnter(trigger)
    const panel = await screen.findByRole('tooltip')
    fireEvent.mouseLeave(trigger)
    fireEvent.mouseEnter(panel)
    await act(() => new Promise((resolve) => setTimeout(resolve, 180)))
    expect(screen.getByRole('tooltip')).toBe(panel)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })
  it('opens on keyboard focus and dismisses when focus leaves', async () => {
    const { trigger } = setup()
    act(() => trigger.focus())
    await screen.findByRole('tooltip')
    fireEvent.mouseLeave(trigger)
    await act(() => new Promise((resolve) => setTimeout(resolve, 180)))
    expect(screen.getByRole('tooltip')).toBeTruthy()
    act(() => screen.getByRole('textbox').focus())
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })
})
