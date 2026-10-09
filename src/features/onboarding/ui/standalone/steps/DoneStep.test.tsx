import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBillingSummary } from '@/features/billing'
import { DoneStep } from './DoneStep'
import { renderStep } from './stepTestUtils'

vi.mock('@/features/billing', () => ({ useBillingSummary: vi.fn() }))

function mockSummary(loaded: boolean) {
  vi.mocked(useBillingSummary).mockReturnValue({
    summary: loaded
      ? {
          availableCredits: 30,
          price: { unitPriceMinor: 200, currency: 'EGP' },
        }
      : null,
    isLoading: !loaded,
    error: null,
    refresh: vi.fn(),
  } as unknown as ReturnType<typeof useBillingSummary>)
}

beforeEach(() => mockSummary(true))

describe('DoneStep', () => {
  it('says Akeed is live and how every order flows', () => {
    renderStep(<DoneStep headingRef={{ current: null }} />)
    expect(
      screen.getByRole('heading', {
        name: 'وصل تأكيدك. هكذا يعمل أكيد مع كل طلب',
      })
    ).toBeTruthy()
    expect(screen.getByText('أكيد يعمل الآن')).toBeTruthy()
    const pipeline = screen.getByRole('list', {
      name: 'كيف يعمل أكيد مع كل طلب',
    })
    expect(pipeline.textContent).toContain('تضيف الطلب')
    expect(pipeline.textContent).toContain('نرسل الرسالة لعميلك')
    expect(pipeline.textContent).toContain('ترى الرد في التأكيدات')
  })

  it('names a cancellation when the merchant answered with Cancel', () => {
    renderStep(<DoneStep headingRef={{ current: null }} reply="canceled" />)
    expect(
      screen.getByRole('heading', {
        name: 'وصل إلغاؤك. هكذا يعمل أكيد مع كل طلب',
      })
    ).toBeTruthy()
  })

  it('puts the money in numbers', () => {
    renderStep(<DoneStep headingRef={{ current: null }} />)
    expect(screen.getByText('30 رسالة')).toBeTruthy()
    expect(screen.getByText('2.00 ج.م')).toBeTruthy()
    expect(screen.getByText('مجانية')).toBeTruthy()
    expect(screen.getByText('لا تُخصم من رصيدك')).toBeTruthy()
  })

  it('shows skeletons, not zeros, while credits load', () => {
    mockSummary(false)
    renderStep(<DoneStep headingRef={{ current: null }} />)
    expect(screen.queryByText(/^0 رسالة/)).toBeNull()
    expect(screen.getByText('رصيدك الآن')).toBeTruthy()
  })

  it('leads to the first order, the import, and the dashboard', () => {
    renderStep(<DoneStep headingRef={{ current: null }} />)
    expect(
      screen.getByRole('link', { name: 'أضف أول طلب' }).getAttribute('href')
    ).toBe('/ar/dashboard?new-order=1')
    expect(
      screen.getByRole('link', { name: 'استيراد من ملف' }).getAttribute('href')
    ).toBe('/ar/verifications?import=new')
    expect(
      screen
        .getByRole('link', { name: 'الذهاب إلى لوحة التحكم' })
        .getAttribute('href')
    ).toBe('/ar/dashboard')
    expect(
      screen.getByText('نرسل التأكيد لعميلك فور إضافة الطلب.')
    ).toBeTruthy()
  })

  it('renders the English copy', () => {
    renderStep(<DoneStep headingRef={{ current: null }} />, 'en')
    expect(screen.getByText('Akeed is live')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Add your first order' })
        .getAttribute('href')
    ).toBe('/en/dashboard?new-order=1')
  })
})
