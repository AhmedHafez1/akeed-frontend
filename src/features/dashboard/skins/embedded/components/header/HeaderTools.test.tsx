import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { TipCardView } from '@/features/tips'
import { useHeaderPanels } from '../../../../domain/useHeaderPanels'
import type { MessageUsageView } from '../../../../model/messageUsage.model'
import { renderEmbedded } from '../embeddedTestUtils'
import { HeaderTools } from './HeaderTools'

const warning: MessageUsageView = {
  kind: 'known',
  used: 25,
  limit: 30,
  remaining: 5,
  fill: 83,
  state: 'warning',
  allowance: 'free',
  stale: false,
}

function tip(id: string, label: string | null): TipCardView {
  return {
    card: {
      id,
      type: 'tip',
      locale: 'en',
      title: `Title ${id}`,
      description: `Description ${id}`,
      action: null,
      published_at: '2026-10-25T10:00:00.000Z',
    },
    link: label
      ? { kind: 'internal', href: `/en/settings?${id}`, label }
      : null,
  }
}

function Harness({
  view = warning,
  initialCards = [
    tip('a', 'Open timing settings'),
    tip('b', 'Open quiet hours'),
  ],
  canDismiss = true,
  onSeen = vi.fn(),
  onDismiss = vi.fn(),
  onChoosePlan = vi.fn(),
}: {
  view?: MessageUsageView
  initialCards?: TipCardView[]
  canDismiss?: boolean
  onSeen?: (id: string) => void
  onDismiss?: (id: string) => void
  onChoosePlan?: () => void
}) {
  const panels = useHeaderPanels('metrics')
  const [cards, setCards] = useState(initialCards)
  return (
    <div data-header-actions="">
      <HeaderTools
        panels={panels}
        usage={{ view, isRefreshing: false, retry: vi.fn() }}
        tips={{
          cards,
          canDismiss,
          onSeen,
          onAction: vi.fn(),
          onDismiss: (id) => {
            onDismiss(id)
            setCards((current) => current.filter((c) => c.card.id !== id))
          },
        }}
        onChoosePlan={onChoosePlan}
      />
      <button type="button">Outside</button>
    </div>
  )
}

const usageTrigger = () =>
  screen.getByRole('button', { name: /messages left|Message usage/ })
const tipsTrigger = () => screen.getByRole('button', { name: 'Tips & updates' })

describe('HeaderTools', () => {
  let observed: Element[] = []
  beforeEach(() => {
    observed = []
    // Every observed entry counts as fully on screen.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(
          private callback: (
            entries: Partial<IntersectionObserverEntry>[]
          ) => void
        ) {}
        observe(element: Element) {
          observed.push(element)
          this.callback([{ isIntersecting: true, intersectionRatio: 1 }])
        }
        disconnect() {}
      }
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows what is left, with a dialog trigger and no badge', () => {
    renderEmbedded(<Harness />, 'en')
    const trigger = usageTrigger()
    expect(trigger.textContent).toBe('5 messages left')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens the usage panel with the explicit count and one plan action', () => {
    const onChoosePlan = vi.fn()
    renderEmbedded(<Harness onChoosePlan={onChoosePlan} />, 'en')
    fireEvent.click(usageTrigger())

    const dialog = screen.getByRole('dialog', { name: 'Message usage' })
    expect(usageTrigger().getAttribute('aria-controls')).toBe(dialog.id)
    expect(document.activeElement).toBe(dialog)
    expect(within(dialog).getByText('Free messages')).toBeTruthy()
    expect(within(dialog).getByText('25 / 30 used')).toBeTruthy()
    expect(within(dialog).getByText('5 messages remaining')).toBeTruthy()
    expect(
      within(dialog).getByRole('progressbar').getAttribute('aria-valuenow')
    ).toBe('25')

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Choose a plan' })
    )
    expect(onChoosePlan).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps one panel open at a time and toggles on its trigger', () => {
    renderEmbedded(<Harness />, 'en')
    fireEvent.click(usageTrigger())
    fireEvent.click(tipsTrigger())
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog', { name: 'Tips & updates' })).toBeTruthy()

    fireEvent.click(tipsTrigger())
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    renderEmbedded(<Harness />, 'en')
    fireEvent.click(usageTrigger())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(usageTrigger()))
  })

  it('closes on an outside press without dismissing anything', () => {
    const onDismiss = vi.fn()
    renderEmbedded(<Harness onDismiss={onDismiss} />, 'en')
    fireEvent.click(tipsTrigger())
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('closes when Tab leaves the panel, without taking focus back', () => {
    renderEmbedded(<Harness />, 'en')
    fireEvent.click(usageTrigger())
    const outside = screen.getByRole('button', { name: 'Outside' })
    fireEvent.blur(screen.getByRole('dialog'), { relatedTarget: outside })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('records tip views only once the panel shows them, in their order', () => {
    const onSeen = vi.fn()
    renderEmbedded(<Harness onSeen={onSeen} />, 'en')
    expect(onSeen).not.toHaveBeenCalled()

    fireEvent.click(tipsTrigger())
    const dialog = screen.getByRole('dialog', { name: 'Tips & updates' })
    expect(onSeen.mock.calls.map(([id]) => id)).toEqual(['a', 'b'])
    const titles = within(dialog).getAllByRole('heading', { level: 3 })
    expect(titles.map((h) => h.textContent)).toEqual(['Title a', 'Title b'])
  })

  it('moves focus to the next entry after a dismissal, then to the empty state', async () => {
    renderEmbedded(<Harness />, 'en')
    fireEvent.click(tipsTrigger())
    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss “Title a” for good' })
    )
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe('Open quiet hours')
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss “Title b” for good' })
    )
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe(
        'No tips or updates right now'
      )
    )
    expect(screen.getByRole('dialog', { name: 'Tips & updates' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('button', { name: 'Tips & updates' })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(usageTrigger()))
  })

  it('hides dismissal when the account may not dismiss', () => {
    renderEmbedded(<Harness canDismiss={false} />, 'en')
    fireEvent.click(tipsTrigger())
    expect(screen.queryByRole('button', { name: /Dismiss/ })).toBeNull()
  })

  it('omits the tips trigger when there is nothing to show', () => {
    renderEmbedded(<Harness initialCards={[]} />, 'en')
    expect(screen.queryByRole('button', { name: 'Tips & updates' })).toBeNull()
  })

  it('stays neutral while loading and when usage is unknown', () => {
    renderEmbedded(<Harness view={{ kind: 'loading' }} />, 'en')
    expect(usageTrigger().textContent).toBe('Message usage')
    expect(usageTrigger().getAttribute('aria-busy')).toBe('true')
  })

  it('keeps the last count after a failed refresh and offers a retry', () => {
    renderEmbedded(<Harness view={{ ...warning, stale: true }} />, 'en')
    expect(usageTrigger().textContent).toBe('5 messages left')
    fireEvent.click(usageTrigger())
    expect(screen.getByText('Unable to refresh usage')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Retry loading message usage' })
    ).toBeTruthy()
  })

  it('reads in Arabic', () => {
    renderEmbedded(<Harness />, 'ar')
    expect(screen.getByRole('button', { name: '5 رسائل متبقية' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'نصائح وتحديثات' })).toBeTruthy()
  })
})
