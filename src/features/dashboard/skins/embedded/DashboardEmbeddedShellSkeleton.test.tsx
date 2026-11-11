import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { DashboardEmbeddedShellSkeleton } from './DashboardEmbeddedShellSkeleton'
import { renderEmbedded } from './components/embeddedTestUtils'

describe('DashboardEmbeddedShellSkeleton', () => {
  it('shows the confirmations view with a ten-row table while loading', () => {
    const { container } = renderEmbedded(
      <DashboardEmbeddedShellSkeleton variant="confirmations" />,
      'en'
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Confirmations' })
    ).toBeTruthy()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(10)
  })

  it('keeps the stats cards for the dashboard view', () => {
    renderEmbedded(<DashboardEmbeddedShellSkeleton variant="stats" />, 'en')

    expect(screen.queryByRole('heading', { name: 'Confirmations' })).toBeNull()
  })
})
