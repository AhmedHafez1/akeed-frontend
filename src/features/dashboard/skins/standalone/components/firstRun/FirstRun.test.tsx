import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBillingSummary } from '@/features/billing'
import ar from '../../../../../../../public/messages/ar.json'
import { useDashboardOverview } from '@/features/dashboard/domain/useDashboardOverview'
import { useStandaloneFirstRun } from '@/features/dashboard/domain/useStandaloneFirstRun'
import { DashboardStandaloneSkin } from '@/features/dashboard/skins/standalone/DashboardStandaloneSkin'

vi.mock('@/features/billing', () => ({ useBillingSummary: vi.fn() }))
vi.mock('@/features/orders', () => ({
  ManualOrderAction: () => <button type="button">تأكيد طلب</button>,
}))
vi.mock('@/features/dashboard/domain/useDashboardOverview', () => ({
  useDashboardOverview: vi.fn(),
}))
vi.mock('@/features/dashboard/domain/useStandaloneFirstRun', () => ({
  useStandaloneFirstRun: vi.fn(),
}))

const settings = {
  auto_verify_enabled: true,
  follow_up_enabled: true,
  follow_up_delay_minutes: 120,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
}

function mockFirstRun(
  status: 'loading' | 'first-run' | 'active',
  showSkippedTestReminder = false
) {
  vi.mocked(useStandaloneFirstRun).mockReturnValue({
    status,
    showSkippedTestReminder,
  })
}

function mockCredits(availableCredits: number) {
  vi.mocked(useBillingSummary).mockReturnValue({
    summary: { availableCredits },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  } as unknown as ReturnType<typeof useBillingSummary>)
}

function renderSkin(ui: ReactElement) {
  document.documentElement.dir = 'rtl'
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

const skin = (
  <DashboardStandaloneSkin
    period="last_30_days"
    periodOptions={[]}
    onPeriodChange={vi.fn()}
    confirmationsHref={(tab) => `/verifications?tab=${tab}`}
    firstName="أحمد"
    phoneTestAction={<button type="button">أرسلها إلى هاتفي</button>}
  />
)

beforeEach(() => {
  vi.mocked(useDashboardOverview).mockReturnValue({
    overview: { settings } as never,
    isLoading: false,
    isError: false,
    retry: vi.fn(),
  })
  mockCredits(30)
})

describe('Standalone dashboard first run', () => {
  it('replaces the KPIs with the greeting and the first-order card', () => {
    mockFirstRun('first-run')
    renderSkin(skin)

    expect(
      screen.getByRole('heading', { level: 1, name: 'مرحبًا أحمد' })
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'أرسل أول تأكيد لعميل حقيقي' })
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'تأكيد طلب' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'استيراد من ملف' }).getAttribute('href')
    ).toContain('/ar/')
    expect(
      screen.getByText('ربط متجرك الإلكتروني ليصل كل طلب تلقائيًا: قريبًا.')
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'التأكيدات' })).toBeTruthy()
    expect(screen.getByText('أُرسل · بانتظار الرد')).toBeTruthy()
    expect(screen.queryByText('التأكيد التلقائي')).toBeTruthy()
  })

  it('shows the full dashboard once a real order exists', () => {
    mockFirstRun('active')
    // The full skin's own states apply; its error state needs no fixture.
    vi.mocked(useDashboardOverview).mockReturnValue({
      overview: null,
      isLoading: false,
      isError: true,
      retry: vi.fn(),
    })
    renderSkin(skin)

    expect(
      screen.getByRole('heading', { level: 1, name: 'لوحة التحكم' })
    ).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'أرسل أول تأكيد لعميل حقيقي' })
    ).toBeNull()
    expect(screen.queryByText('مرحبًا أحمد')).toBeNull()
  })

  it('shows a skeleton, not the card, while first run is unknown', () => {
    mockFirstRun('loading')
    const { container } = renderSkin(skin)

    expect(
      screen.queryByRole('heading', { name: 'أرسل أول تأكيد لعميل حقيقي' })
    ).toBeNull()
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
  })

  it('says the balance is empty and links to billing instead of order actions', () => {
    mockFirstRun('first-run')
    mockCredits(0)
    renderSkin(skin)

    expect(screen.getByText('رصيدك 0 رسالة')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'شحن الرصيد' }).getAttribute('href')
    ).toBe('/ar/billing')
    expect(screen.queryByRole('button', { name: 'تأكيد طلب' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'استيراد من ملف' })).toBeNull()
  })

  it('reminds a merchant who skipped the test, with the free send action', () => {
    mockFirstRun('first-run', true)
    renderSkin(skin)

    expect(screen.getByText('لم تجرّب الرسالة بعد')).toBeTruthy()
    expect(
      screen.getByText(
        'شاهدها على هاتفك قبل أن تصل لأول عميل. دقيقة واحدة، ومجانًا.'
      )
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'أرسلها إلى هاتفي' })
    ).toBeTruthy()
  })

  it('has no reminder when the test was not skipped', () => {
    mockFirstRun('first-run', false)
    renderSkin(skin)

    expect(screen.queryByText('لم تجرّب الرسالة بعد')).toBeNull()
  })
})
