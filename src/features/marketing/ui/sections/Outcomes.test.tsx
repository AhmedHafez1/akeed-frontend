import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import Outcomes from './Outcomes'

describe('Outcomes', () => {
  it('names the three answers and what each one means', () => {
    renderMarketing(<Outcomes />, 'en')

    const cards = screen.getAllByRole('listitem')
    expect(cards.map((card) => card.querySelector('h3')?.textContent)).toEqual([
      'Confirmed',
      'Canceled',
      'No reply',
    ])
    expect(cards[0].textContent).toContain('Ship the order')
    expect(cards[1].textContent).toContain("Don't ship")
    expect(cards[2].textContent).toContain('Follow up')
  })

  it('does not claim a customer cancel cancels the order in the store', () => {
    renderMarketing(<Outcomes />, 'en')

    const canceled = screen.getAllByRole('listitem')[1]
    expect(canceled.textContent).not.toMatch(/cancels the order in/i)
  })

  it('renders in Arabic', () => {
    renderMarketing(<Outcomes />, 'ar')

    expect(screen.getByText('ثلاث نتائج محتملة')).toBeTruthy()
  })
})
