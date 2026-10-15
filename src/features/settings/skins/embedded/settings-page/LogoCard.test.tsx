import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import type { MerchantLogoModel } from '../../../domain/useMerchantLogo'
import { LogoCard } from './LogoCard'

function model(overrides: Partial<MerchantLogoModel> = {}): MerchantLogoModel {
  return {
    branding: {
      logoUrl: 'https://cdn.test/l.png',
      bannerUrl: 'https://cdn.test/b.jpg',
      updatedAt: '2026-10-15T10:00:00.000Z',
      logoHeaderAvailable: true,
    },
    isAvailable: true,
    isUploading: false,
    isRemoving: false,
    error: null,
    choose: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  }
}

function renderCard(logo: MerchantLogoModel, readOnly = false) {
  return render(
    <AppProvider i18n={enTranslations}>
      <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
        <LogoCard logo={logo} readOnly={readOnly} />
      </NextIntlClientProvider>
    </AppProvider>
  )
}

describe('LogoCard (embedded)', () => {
  it('shows the banner and removes the logo (ar)', () => {
    const logo = model()
    renderCard(logo)
    expect(screen.getByRole('heading', { name: 'شعار المتجر' })).toBeTruthy()
    expect(
      screen
        .getByRole('img', { name: 'شعارك على شريط الرسالة' })
        .getAttribute('src')
    ).toBe('https://cdn.test/b.jpg')
    fireEvent.click(screen.getByRole('button', { name: 'إزالة' }))
    expect(logo.remove).toHaveBeenCalledOnce()
  })

  it('shows the translated error', () => {
    renderCard(model({ error: 'unsupportedType' }))
    expect(screen.getByText('اختر صورة PNG أو JPEG.')).toBeTruthy()
  })

  it('hides upload and remove from a read-only member', () => {
    renderCard(model(), true)
    expect(screen.queryByRole('button', { name: 'إزالة' })).toBeNull()
    expect(screen.queryByText('تغيير الشعار')).toBeNull()
  })
})
