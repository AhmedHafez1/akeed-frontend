import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import type { MerchantLogoModel } from '@/features/settings/domain/useMerchantLogo'
import { StoreLogoField } from './StoreLogoField'

const LOGO = 'https://cdn.test/l.png'

function model(overrides: Partial<MerchantLogoModel> = {}): MerchantLogoModel {
  return {
    branding: {
      logoUrl: LOGO,
      bannerUrl: 'https://cdn.test/b.jpg',
      updatedAt: '2026-10-15T12:00:00.000Z',
      logoHeaderAvailable: true,
      logoHeaderIncluded: true,
    },
    isAvailable: true,
    isLocked: false,
    isUploading: false,
    isRemoving: false,
    error: null,
    choose: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  }
}

const empty = (overrides: Partial<MerchantLogoModel> = {}) =>
  model({
    branding: {
      logoUrl: null,
      bannerUrl: null,
      updatedAt: null,
      logoHeaderAvailable: true,
      logoHeaderIncluded: true,
    },
    ...overrides,
  })

function renderField(logo: MerchantLogoModel, readOnly = false) {
  return renderEmbedded(<StoreLogoField logo={logo} readOnly={readOnly} />)
}

describe('StoreLogoField (embedded, ar)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offers one upload area when there is no logo', () => {
    const logo = empty()
    const { container } = renderField(logo)
    expect(screen.getByRole('heading', { name: 'شعار المتجر' })).toBeTruthy()
    expect(screen.getByLabelText('ارفع شعارك')).toBeTruthy()
    expect(screen.getByText('أو اسحب الصورة إلى هنا')).toBeTruthy()
    expect(
      screen.getByText(
        'PNG أو JPEG، حتى 5 ميجابايت، وأقصر ضلع فيها 64 بكسل على الأقل.'
      )
    ).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'إزالة شعار المتجر' })
    ).toBeNull()

    const input = container.querySelector('input[type="file"]')
    expect(input?.getAttribute('accept')).toBe('image/png,image/jpeg')
    const file = new File(['png'], 'logo.png', { type: 'image/png' })
    fireEvent.change(input!, { target: { files: [file] } })
    expect(logo.choose).toHaveBeenCalledWith(file)
  })

  it('shows the logo in one row with its date and actions', () => {
    renderField(model())
    expect(
      screen.getByRole('img', { name: 'شعار متجرك' }).getAttribute('src')
    ).toBe(LOGO)
    expect(screen.getByText('الشعار الحالي')).toBeTruthy()
    expect(screen.getByText(/^آخر تحديث .*15.*2026/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'تغيير الشعار' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'إزالة شعار المتجر' })
    ).toBeTruthy()
    // The large banner preview is gone; the phone preview shows it.
    expect(
      screen.queryByRole('img', { name: 'شعارك على شريط الرسالة' })
    ).toBeNull()
    expect(screen.queryByText('يظهر هذا الشريط أعلى كل رسالة.')).toBeNull()
  })

  it('opens the file picker from Change and passes the file on', () => {
    const logo = model()
    const click = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => {})
    const { container } = renderField(logo)
    fireEvent.click(screen.getByRole('button', { name: 'تغيير الشعار' }))
    expect(click).toHaveBeenCalledOnce()

    const file = new File(['png'], 'new.png', { type: 'image/png' })
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })
    expect(logo.choose).toHaveBeenCalledWith(file)
  })

  it('removes through the existing handler', () => {
    const logo = model()
    renderField(logo)
    fireEvent.click(screen.getByRole('button', { name: 'إزالة شعار المتجر' }))
    expect(logo.remove).toHaveBeenCalledOnce()
  })

  it('locks the row while uploading', () => {
    const { container } = renderField(model({ isUploading: true }))
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
    expect(screen.getAllByText('جارٍ رفع الشعار…').length).toBeGreaterThan(0)
    expect(
      screen
        .getByRole('button', { name: 'تغيير الشعار' })
        .getAttribute('aria-disabled')
    ).toBe('true')
    expect(
      screen
        .getByRole('button', { name: 'إزالة شعار المتجر' })
        .getAttribute('aria-disabled')
    ).toBe('true')
  })

  it.each([
    ['unsupportedType', 'نوع الملف غير مدعوم. اختر صورة PNG أو JPEG.'],
    ['tooLarge', 'الملف أكبر من 5 ميجابايت. اختر صورة أصغر.'],
    ['tooSmall', 'الصورة صغيرة. يجب ألا يقل أقصر ضلع فيها عن 64 بكسل.'],
    ['storageUnavailable', 'تعذّر رفع الشعار. حاول مرة أخرى.'],
  ] as const)('shows the %s error under the row', (error, text) => {
    renderField(model({ error }))
    expect(screen.getByText(text)).toBeTruthy()
    // The previous logo stays while the error shows.
    expect(screen.getByRole('img', { name: 'شعار متجرك' })).toBeTruthy()
  })

  it('shows the error under the empty area too', () => {
    renderField(empty({ error: 'tooLarge' }))
    expect(
      screen.getByText('الملف أكبر من 5 ميجابايت. اختر صورة أصغر.')
    ).toBeTruthy()
  })

  it('moves focus to the upload area after the logo is removed', () => {
    function Harness() {
      const [logo, setLogo] = useState(model)
      return (
        <>
          <StoreLogoField logo={logo} readOnly={false} />
          <button type="button" onClick={() => setLogo(empty())}>
            removed
          </button>
        </>
      )
    }
    renderEmbedded(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'removed' }))
    expect(document.activeElement).toBe(screen.getByLabelText('ارفع شعارك'))
  })

  it('hides the actions from a read-only member', () => {
    renderField(model(), true)
    expect(screen.queryByRole('button', { name: 'تغيير الشعار' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'إزالة شعار المتجر' })
    ).toBeNull()
    expect(screen.getByRole('img', { name: 'شعار متجرك' })).toBeTruthy()
  })

  it('locks an empty card below the plan and opens the plans', () => {
    const onSeePlans = vi.fn()
    renderEmbedded(
      <StoreLogoField
        logo={empty({ isLocked: true })}
        readOnly={false}
        onSeePlans={onSeePlans}
      />
    )
    expect(screen.getByText('الباقة الاحترافية')).toBeTruthy()
    expect(
      screen.getByText('شعارك على الرسائل متاح في الباقة الاحترافية وما فوقها.')
    ).toBeTruthy()
    expect(screen.queryByLabelText('ارفع شعارك')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'عرض الباقات' }))
    expect(onSeePlans).toHaveBeenCalledOnce()
  })

  it('keeps a saved logo removable but not replaceable below the plan', () => {
    const logo = model({ isLocked: true })
    renderField(logo)
    expect(
      screen.getByText(/^شعارك المحفوظ لا يُرسل مع باقتك الحالية/)
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'تغيير الشعار' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'إزالة شعار المتجر' }))
    expect(logo.remove).toHaveBeenCalledOnce()
  })
})
