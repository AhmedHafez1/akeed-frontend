import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBillingSummary } from '@/features/billing'
import ar from '../../../public/messages/ar.json'
import { StandaloneSidebar } from './StandaloneSidebar'

vi.mock('@/features/billing', () => ({ useBillingSummary: vi.fn() }))
vi.mock('@/features/admin/useIsAdmin', () => ({ useIsAdmin: () => false }))
vi.mock('./AkeedLogo', () => ({ AkeedLogo: () => null }))
vi.mock('./StandaloneShellContext', () => ({
  useStandaloneShell: () => ({
    identity: { workspaceName: 'Togo', fullName: 'Ahmed', email: null },
    isIdentityLoading: false,
  }),
}))

function mockBilling(billingEnabled: boolean) {
  vi.mocked(useBillingSummary).mockReturnValue({
    summary: { billingEnabled },
  } as ReturnType<typeof useBillingSummary>)
}

function renderSidebar() {
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
  render(
    <NextIntlClientProvider locale="ar" messages={ar}>
      <StandaloneSidebar />
    </NextIntlClientProvider>
  )
  const nav = screen.getByRole('navigation', {
    name: ar.appHeader.primaryNavigation,
  })
  return within(nav)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')])
}

beforeEach(() => mockBilling(true))

describe('StandaloneSidebar', () => {
  it('lists the four pages in order, with no Templates page', () => {
    expect(renderSidebar()).toEqual([
      ['لوحة التحكم', '/ar/dashboard'],
      ['التأكيدات', '/ar/verifications'],
      ['الفوترة والرصيد', '/ar/billing'],
      ['الإعدادات', '/ar/settings'],
    ])
    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(hrefs).not.toContain('/ar/templates')
  })

  it('leaves Billing out when billing is not enabled', () => {
    mockBilling(false)
    expect(renderSidebar().map(([label]) => label)).toEqual([
      'لوحة التحكم',
      'التأكيدات',
      'الإعدادات',
    ])
  })

  it('marks the current page', () => {
    renderSidebar()
    expect(
      screen
        .getByRole('link', { name: 'لوحة التحكم' })
        .getAttribute('aria-current')
    ).toBe('page')
    expect(
      screen
        .getByRole('link', { name: 'الإعدادات' })
        .getAttribute('aria-current')
    ).toBeNull()
  })
})
