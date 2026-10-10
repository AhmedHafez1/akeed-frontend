import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/shared/lib/auth'
import { renderAuth } from '../authTestUtils'
import { SignupForm } from './SignupForm'
import { useSignup } from './useSignup'

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/auth')>()
  return {
    ...actual,
    auth: { ...actual.auth, signUp: vi.fn() },
  }
})

const signUp = vi.mocked(auth.signUp)

function Harness({
  locale,
  onEmailSent,
}: {
  locale: 'ar' | 'en'
  onEmailSent: (email: string) => void
}) {
  const signup = useSignup({ locale, onEmailSent, onSignedIn: vi.fn() })
  return <SignupForm signup={signup} locale={locale} sourceId="standalone" />
}

function renderForm(locale: 'ar' | 'en' = 'ar') {
  const onEmailSent = vi.fn()
  renderAuth(<Harness locale={locale} onEmailSent={onEmailSent} />, locale)
  return { onEmailSent }
}

function fill(values: Partial<Record<string, string>>) {
  const byId = (id: string) => document.getElementById(id) as HTMLInputElement
  const map: Record<string, string> = {
    fullName: 'signup-full-name',
    storeName: 'signup-store-name',
    email: 'signup-email',
    password: 'signup-password',
  }
  for (const [field, value] of Object.entries(values)) {
    fireEvent.change(byId(map[field]), { target: { value } })
  }
}

function fillValid() {
  fill({
    fullName: 'أحمد حافظ',
    storeName: 'متجر نور',
    email: 'ahmed@noorstore.com',
    password: 'secret-pass',
  })
  fireEvent.click(document.getElementById('signup-terms') as HTMLElement)
}

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }))

describe('SignupForm', () => {
  beforeEach(() => {
    signUp.mockReset()
  })

  it('renders the four fields in order and no confirm-password', () => {
    renderForm()
    const labels = screen
      .getAllByText(/^(اسمك|اسم المتجر|البريد الإلكتروني|كلمة المرور)$/)
      .map((node) => node.textContent)
    expect(labels).toEqual([
      'اسمك',
      'اسم المتجر',
      'البريد الإلكتروني',
      'كلمة المرور',
    ])
    expect(screen.queryByText(/تأكيد كلمة المرور/)).toBeNull()
    expect(
      screen.getByText('يظهر في رسائل التأكيد التي تصل لعملائك.')
    ).toBeTruthy()
  })

  it('has no order-source picker and no Shopify link of its own', () => {
    renderForm()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByRole('link', { name: /Shopify/ })).toBeNull()
  })

  it.each([
    ['ar', 'مصدر الطلبات', 'بدون متجر مربوط', 'تغيير مصدر الطلبات'],
    ['en', 'Order source', 'No connected store', 'Change order source'],
  ] as const)(
    'names the chosen source in %s and links back to the source step',
    (locale, label, sourceName, change) => {
      renderForm(locale)
      expect(screen.getByText(label)).toBeTruthy()
      expect(screen.getByText(sourceName)).toBeTruthy()
      expect(
        screen.getByRole('link', { name: change }).getAttribute('href')
      ).toBe(`/${locale}/signup`)
    }
  )

  it('states the next step, the free allowance and the price under the source', () => {
    renderForm('en')
    const summary = screen.getByText(/After you verify your email/)
    expect(summary.textContent).toContain('30 free WhatsApp messages')
    expect(summary.textContent).toContain('2.00 EGP per message')
  })

  it('shows inline errors and focuses the first invalid field', async () => {
    renderForm()
    fill({ fullName: 'أحمد', password: '1234567' })
    submit()

    expect(
      await screen.findByText('اكتب اسم متجرك كما يعرفه عملاؤك.')
    ).toBeTruthy()
    expect(
      screen.getByText('كلمة المرور قصيرة. اكتب 8 أحرف على الأقل.')
    ).toBeTruthy()
    expect(screen.getByText('وافق على الشروط لإنشاء الحساب.')).toBeTruthy()
    const storeName = document.getElementById('signup-store-name')
    expect(storeName?.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(storeName)
    expect(signUp).not.toHaveBeenCalled()
  })

  it.each(['ar', 'en'] as const)(
    'signs up with company_name metadata and redirects %s to onboarding',
    async (locale) => {
      signUp.mockResolvedValue({
        user: { identities: [{ id: '1' }] },
        session: null,
      } as never)
      const { onEmailSent } = renderForm(locale)
      fillValid()
      fireEvent.click(
        screen.getByRole('button', {
          name: locale === 'ar' ? 'إنشاء الحساب' : 'Create account',
        })
      )

      await waitFor(() =>
        expect(onEmailSent).toHaveBeenCalledWith('ahmed@noorstore.com')
      )
      expect(signUp).toHaveBeenCalledWith(
        'ahmed@noorstore.com',
        'secret-pass',
        {
          metadata: { full_name: 'أحمد حافظ', company_name: 'متجر نور' },
          emailRedirectTo: `${window.location.origin}/${locale}/onboarding`,
        }
      )
    }
  )

  it('points an already-registered email to sign-in', async () => {
    signUp.mockResolvedValue({
      user: { identities: [] },
      session: null,
    } as never)
    const { onEmailSent } = renderForm()
    fillValid()
    submit()

    const link = await screen.findByRole('link', {
      name: 'سجّل الدخول بدلًا من ذلك',
    })
    expect(link?.getAttribute('href')).toBe('/ar/login')
    expect(screen.getByText(/هذا البريد مسجّل/)).toBeTruthy()
    expect(document.activeElement).toBe(document.getElementById('signup-email'))
    expect(onEmailSent).not.toHaveBeenCalled()
  })

  it('shows a form-level alert when Supabase fails', async () => {
    signUp.mockRejectedValue(new Error('network'))
    renderForm()
    fillValid()
    submit()

    expect((await screen.findByRole('alert')).textContent).toContain(
      'تعذّر إنشاء الحساب. حاول مرة أخرى.'
    )
  })
})
