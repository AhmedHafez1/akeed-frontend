import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SignupSource } from '@/shared/config/commerceSources'
import { auth } from '@/shared/lib/auth'
import { renderAuth } from '../authTestUtils'
import { SignupForm } from './SignupForm'
import { toSignupMetadata, type SignupValues } from './signup.model'
import { useSignup } from './useSignup'

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/auth')>()
  return {
    ...actual,
    auth: { ...actual.auth, signUp: vi.fn() },
  }
})

const signUp = vi.mocked(auth.signUp)

const STANDALONE: SignupSource = {
  id: 'standalone',
  organizationSourceMode: 'standalone',
}
const EASYORDERS: SignupSource = {
  id: 'easyorders',
  organizationSourceMode: 'connect',
}

function Harness({
  locale,
  sources,
}: {
  locale: 'ar' | 'en'
  sources: readonly SignupSource[]
}) {
  const signup = useSignup({
    locale,
    onEmailSent: vi.fn(),
    onSignedIn: vi.fn(),
  })
  return <SignupForm signup={signup} locale={locale} sources={sources} />
}

function fillValid() {
  const set = (id: string, value: string) =>
    fireEvent.change(document.getElementById(id) as HTMLInputElement, {
      target: { value },
    })
  set('signup-full-name', 'أحمد حافظ')
  set('signup-store-name', 'متجر نور')
  set('signup-email', 'ahmed@noorstore.com')
  set('signup-password', 'secret-pass')
  fireEvent.click(document.getElementById('signup-terms') as HTMLElement)
}

const values: SignupValues = {
  fullName: ' أحمد حافظ ',
  storeName: ' متجر نور ',
  email: 'ahmed@noorstore.com',
  password: 'secret-pass',
  terms: true,
}

describe('signup order source', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signUp.mockResolvedValue({ session: null, user: null } as never)
  })

  it('shows no picker while Standalone is the only source', () => {
    renderAuth(<Harness locale="ar" sources={[STANDALONE]} />)

    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it.each([
    ['ar', 'من أين تأتي طلباتك؟', 'موقعي الخاص أو طلبات أضيفها بنفسي'],
    [
      'en',
      'Where do your orders come from?',
      'My own website or orders I add myself',
    ],
  ] as const)(
    'offers the sources in %s with Standalone selected',
    (locale, label, standaloneTitle) => {
      renderAuth(
        <Harness locale={locale} sources={[STANDALONE, EASYORDERS]} />,
        locale
      )

      const group = screen.getByRole('radiogroup', { name: label })
      const radios = Array.from(group.querySelectorAll('[role="radio"]'))
      expect(radios).toHaveLength(2)
      expect(radios[0].textContent).toContain(standaloneTitle)
      expect(radios[0].getAttribute('aria-checked')).toBe('true')
      expect(radios[1].textContent).toContain('EasyOrders')
      expect(radios[1].getAttribute('aria-checked')).toBe('false')
    }
  )

  it('saves the chosen source in the signup metadata, before any organization exists', async () => {
    renderAuth(<Harness locale="ar" sources={[STANDALONE, EASYORDERS]} />)
    fillValid()
    fireEvent.click(screen.getByRole('radio', { name: /EasyOrders/ }))
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }))

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
    expect(signUp.mock.calls[0][2]).toMatchObject({
      metadata: {
        full_name: 'أحمد حافظ',
        company_name: 'متجر نور',
        signup_source: 'easyorders',
      },
    })
  })

  it('moves the selection with the arrow keys, following the writing direction', () => {
    renderAuth(<Harness locale="ar" sources={[STANDALONE, EASYORDERS]} />)
    const [first, second] = screen.getAllByRole('radio')

    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })

    expect(second.getAttribute('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(second)
  })

  it('leaves Standalone unsaid, so existing signups are unchanged', () => {
    expect(toSignupMetadata(values)).toEqual({
      full_name: 'أحمد حافظ',
      company_name: 'متجر نور',
    })
    expect(toSignupMetadata({ ...values, source: 'standalone' })).toEqual({
      full_name: 'أحمد حافظ',
      company_name: 'متجر نور',
    })
    expect(toSignupMetadata({ ...values, source: 'easyorders' })).toEqual({
      full_name: 'أحمد حافظ',
      company_name: 'متجر نور',
      signup_source: 'easyorders',
    })
  })
})
