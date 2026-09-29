import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TimelineRow } from '@/features/onboarding/model/onboardingTest'
import { TestTimeline } from './TestTimeline'

const rows: TimelineRow[] = [
  { id: 'sent', label: 'Message sent', state: 'done', timeLabel: '10:02' },
  {
    id: 'tap',
    label: 'Tap "Confirm order"',
    state: 'current',
    isAction: true,
    note: 'You tapped "Cancel order"',
  },
  {
    id: 'detect',
    label: "We'll detect your reply automatically",
    state: 'upcoming',
  },
]

describe('TestTimeline', () => {
  it('renders every row label', () => {
    render(<TestTimeline rows={rows} />)
    expect(screen.getByText('Message sent')).toBeTruthy()
    expect(screen.getByText('Tap "Confirm order"')).toBeTruthy()
    expect(
      screen.getByText("We'll detect your reply automatically")
    ).toBeTruthy()
  })

  it('marks only the current row with aria-current="step"', () => {
    render(<TestTimeline rows={rows} />)
    const current = screen.getByText('Tap "Confirm order"').closest('li')
    const done = screen.getByText('Message sent').closest('li')
    const upcoming = screen
      .getByText("We'll detect your reply automatically")
      .closest('li')

    expect(current?.getAttribute('aria-current')).toBe('step')
    expect(done?.getAttribute('aria-current')).toBeNull()
    expect(upcoming?.getAttribute('aria-current')).toBeNull()
  })

  it('renders the note under the current action row', () => {
    render(<TestTimeline rows={rows} />)
    expect(screen.getByText('You tapped "Cancel order"')).toBeTruthy()
  })

  it('renders the trailing time label when present', () => {
    render(<TestTimeline rows={rows} />)
    expect(screen.getByText('10:02')).toBeTruthy()
  })

  it('does not render a time label when absent', () => {
    render(<TestTimeline rows={rows} />)
    expect(screen.queryByText('undefined')).toBeNull()
  })

  it('numbers the current and upcoming markers, without a number on done', () => {
    render(<TestTimeline rows={rows} />)
    const currentRow = screen.getByText('Tap "Confirm order"').closest('li')
    const upcomingRow = screen
      .getByText("We'll detect your reply automatically")
      .closest('li')

    expect(screen.queryByText('1', { exact: true })).toBeNull()
    expect(currentRow?.querySelector('span')?.textContent).toBe('2')
    expect(upcomingRow?.querySelector('span')?.textContent).toBe('3')
  })
})
