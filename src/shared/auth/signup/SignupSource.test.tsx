import { useEffect } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StartRoute } from '@/shared/config/commerceSources'
import { auth } from '@/shared/lib/auth'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import { renderAuth } from '../authTestUtils'
import { SignupForm } from './SignupForm'
import { SignupSourceStep } from './SignupSourceStep'
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

const SHOPIFY: StartRoute = { id: 'shopify', kind: 'external' }
const WOOCOMMERCE: StartRoute = { id: 'woocommerce', kind: 'signup' }
const EASYORDERS: StartRoute = { id: 'easyorders', kind: 'signup' }
const STANDALONE: StartRoute = { id: 'standalone', kind: 'signup' }
const ALL_ROUTES = [SHOPIFY, WOOCOMMERCE, EASYORDERS, STANDALONE]

/** The form as the page mounts it: the source comes from the URL. */
function Harness({ sourceId }: { sourceId: string }) {
  const signup = useSignup({
    locale: 'ar',
    onEmailSent: vi.fn(),
    onSignedIn: vi.fn(),
  })
  const { setValue } = signup
  useEffect(() => setValue('source', sourceId), [setValue, sourceId])
  return <SignupForm signup={signup} locale="ar" sourceId={sourceId} />
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

const hrefs = () =>
  Array.from(screen.getByRole('navigation').querySelectorAll('a')).map((link) =>
    link.getAttribute('href')
  )

describe('signup source step', () => {
  it.each([
    ['ar', 'من أين تأتي طلباتك؟', 'بدون متجر مربوط'],
    ['en', 'Where do your orders come from?', 'No connected store'],
  ] as const)(
    'lists every start route in %s, one link each',
    (locale, heading, standaloneTitle) => {
      renderAuth(
        <SignupSourceStep locale={locale} routes={ALL_ROUTES} />,
        locale
      )

      expect(screen.getByRole('heading', { name: heading })).toBeTruthy()
      const rows = Array.from(
        screen.getByRole('navigation').querySelectorAll('a')
      )
      expect(rows.map((row) => row.textContent)).toEqual([
        expect.stringContaining('Shopify'),
        expect.stringContaining('WooCommerce'),
        expect.stringContaining('EasyOrders'),
        expect.stringContaining(standaloneTitle),
      ])
      expect(hrefs()).toEqual([
        SHOPIFY_APP_STORE_LISTING_URL,
        '?source=woocommerce',
        '?source=easyorders',
        '?source=standalone',
      ])
    }
  )

  it('still offers Shopify and no connected store when no store is switched on', () => {
    renderAuth(<SignupSourceStep locale="ar" routes={[SHOPIFY, STANDALONE]} />)

    expect(hrefs()).toEqual([
      SHOPIFY_APP_STORE_LISTING_URL,
      '?source=standalone',
    ])
    expect(screen.queryByText('WooCommerce')).toBeNull()
    expect(screen.queryByText('EasyOrders')).toBeNull()
  })

  it('points an existing merchant to sign-in', () => {
    renderAuth(<SignupSourceStep locale="en" routes={ALL_ROUTES} />, 'en')

    expect(
      screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')
    ).toBe('/en/login')
  })
})

describe('signup order source', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signUp.mockResolvedValue({ session: null, user: null } as never)
  })

  it.each(['easyorders', 'woocommerce'])(
    'saves %s in the signup metadata, before any organization exists',
    async (sourceId) => {
      renderAuth(<Harness sourceId={sourceId} />)
      fillValid()
      fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }))

      await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
      expect(signUp.mock.calls[0][2]).toMatchObject({
        metadata: {
          full_name: 'أحمد حافظ',
          company_name: 'متجر نور',
          signup_source: sourceId,
        },
      })
    }
  )

  it('leaves no connected store unsaid in the metadata', async () => {
    renderAuth(<Harness sourceId="standalone" />)
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء الحساب' }))

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
    expect(signUp.mock.calls[0][2]?.metadata).toEqual({
      full_name: 'أحمد حافظ',
      company_name: 'متجر نور',
    })
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
