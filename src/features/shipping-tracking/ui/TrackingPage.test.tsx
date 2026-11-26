import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import en from '../../../../public/messages/en.json'
import { TrackingPage, type TrackingPageLabels } from './TrackingPage'

const t = en.trackingLink
const labels: TrackingPageLabels = {
  trackingNumber: t.trackingNumber,
  copy: t.copy,
  copied: t.copied,
  courierContact: t.courierContact,
  unavailableTitle: t.unavailableTitle,
  unavailableBody: t.unavailableBody,
  sentWith: t.sentWith,
}

afterEach(() => vi.restoreAllMocks())

describe('TrackingPage', () => {
  it('shows the store, the order, the courier and the number to copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(
      <TrackingPage
        state="page"
        labels={labels}
        heading="Your order #1042 is on its way"
        storeName="Cairo Store"
        courier="Mylerz"
        trackingNumber="M-77"
      />
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Your order #1042 is on its way'
    )
    expect(screen.getByText('Cairo Store')).toBeTruthy()
    expect(screen.getByText('Mylerz · Tracking number')).toBeTruthy()
    expect(screen.getByText('M-77')).toBeTruthy()
    expect(screen.getByText(t.courierContact)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: t.copy }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('M-77'))
    expect(await screen.findByRole('button', { name: t.copied })).toBeTruthy()
  })

  it('shows only the order and the courier line with nothing to track', () => {
    render(
      <TrackingPage
        state="page"
        labels={labels}
        heading="Your order is on its way"
        storeName={null}
        courier={null}
        trackingNumber={null}
      />
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(t.courierContact)).toBeTruthy()
  })

  it('shows the neutral page for an unavailable link', () => {
    render(<TrackingPage state="unavailable" labels={labels} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      t.unavailableTitle
    )
    expect(screen.queryByText(t.courierContact)).toBeNull()
  })
})
