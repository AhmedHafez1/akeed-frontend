import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import type { MerchantLogoModel } from '../../../domain/useMerchantLogo'
import { SettingsPhonePreview } from '../../shared/SettingsPhonePreview'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'
import { LogoCard } from './LogoCard'

const LOGO = 'https://cdn.test/merchant-logos/int-1/abc-logo.png'
const BANNER = 'https://cdn.test/merchant-logos/int-1/abc-banner.jpg'

function model(overrides: Partial<MerchantLogoModel> = {}): MerchantLogoModel {
  return {
    branding: {
      logoUrl: null,
      bannerUrl: null,
      updatedAt: null,
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

function renderCard(
  logo: MerchantLogoModel,
  {
    locale = 'en',
    readOnly = false,
  }: { locale?: 'ar' | 'en'; readOnly?: boolean } = {}
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <LogoCard logo={logo} readOnly={readOnly} />
    </NextIntlClientProvider>
  )
}

const withLogo = () =>
  model({
    branding: {
      logoUrl: LOGO,
      bannerUrl: BANNER,
      updatedAt: '2026-10-15T10:00:00.000Z',
      logoHeaderAvailable: true,
    },
  })

describe('LogoCard (standalone)', () => {
  it('offers an upload when there is no logo, and no remove', () => {
    renderCard(model())
    expect(screen.getByRole('heading', { name: 'Store logo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows the logo and the banner, with replace and remove', () => {
    const logo = withLogo()
    renderCard(logo)
    expect(
      screen.getByRole('img', { name: 'Your store logo' }).getAttribute('src')
    ).toBe(LOGO)
    expect(
      screen
        .getByRole('img', { name: 'Your logo on the message banner' })
        .getAttribute('src')
    ).toBe(BANNER)
    expect(screen.getByRole('button', { name: 'Replace logo' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(logo.remove).toHaveBeenCalledOnce()
  })

  it('hands the chosen file to the model', () => {
    const logo = model()
    const { container } = renderCard(logo)
    const input = container.querySelector('input[type="file"]')
    expect(input?.getAttribute('accept')).toBe('image/png,image/jpeg')
    const file = new File(['png'], 'logo.png', { type: 'image/png' })
    fireEvent.change(input!, { target: { files: [file] } })
    expect(logo.choose).toHaveBeenCalledWith(file)
  })

  it('shows the translated error for a backend code (ar)', () => {
    renderCard(model({ error: 'tooSmall' }), { locale: 'ar' })
    expect(screen.getByRole('alert').textContent).toBe(
      'الشعار صغير جدًا. استخدم شعارًا لا يقل ضلعه الأقصر عن 64 بكسل.'
    )
  })

  it('shows no actions to a read-only member', () => {
    renderCard(withLogo(), { readOnly: true })
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('img', { name: 'Your store logo' })).toBeTruthy()
  })
})

describe('SettingsPhonePreview with a banner', () => {
  const message = templateMessageFixture(['Hi {{customer}}'], ['Yes', 'No'])
  const sample = { customer: 'Sara', store: 'Shop', order: '1', total: '1 SAR' }

  function renderPreview(headerImage?: { src: string; alt: string }) {
    return render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <SettingsPhonePreview
          language="en"
          message={message}
          sample={sample}
          label="Preview"
          emptyLabel="Empty"
          headerImage={headerImage}
        />
      </NextIntlClientProvider>
    )
  }

  it('puts the banner above the text', () => {
    const { container } = renderPreview({ src: BANNER, alt: 'Banner' })
    const image = container.querySelector('img[alt="Banner"]')
    expect(image?.getAttribute('src')).toBe(BANNER)
    const text = [...container.querySelectorAll('p')].find((p) =>
      p.textContent?.includes('Hi Sara')
    )
    expect(
      image!.compareDocumentPosition(text!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('shows no image without a banner', () => {
    const { container } = renderPreview()
    expect(container.querySelector('img[alt="Banner"]')).toBeNull()
  })
})
