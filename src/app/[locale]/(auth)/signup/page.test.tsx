import type { ReactNode } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderAuth } from '@/shared/auth/authTestUtils'
import { auth } from '@/shared/lib/auth'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import SignupPage from './page'

// EasyOrders is switched on and WooCommerce is left off, before the source
// registry is first read.
const nav = vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_EASYORDERS_CONNECT_ENABLED', 'true')
  vi.stubEnv('NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED', 'false')
  return { search: '', replace: vi.fn(), push: vi.fn() }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/signup',
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.search),
}))

vi.mock('@/shared/layout/AuthLayout', () => ({
  AuthFrame: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/shared/layout/StandaloneOnboardingShell', () => ({
  StandaloneOnboardingShell: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/auth')>()
  return {
    ...actual,
    auth: { ...actual.auth, signUp: vi.fn(), resendSignupEmail: vi.fn() },
  }
})

const signUp = vi.mocked(auth.signUp)

function renderAt(search: string) {
  nav.search = search
  return renderAuth(<SignupPage />, 'en')
}

function fillValid() {
  const set = (id: string, value: string) =>
    fireEvent.change(document.getElementById(id) as HTMLInputElement, {
      target: { value },
    })
  set('signup-full-name', 'Ahmed Hafez')
  set('signup-store-name', 'Noor Store')
  set('signup-email', 'ahmed@noorstore.com')
  set('signup-password', 'secret-pass')
  fireEvent.click(document.getElementById('signup-terms') as HTMLElement)
}

const SOURCE_HEADING = 'Where do your orders come from?'
const FORM_HEADING = 'Create your account'

describe('signup page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signUp.mockResolvedValue({ session: null, user: null } as never)
  })

  afterAll(() => vi.unstubAllEnvs())

  it('asks where the orders come from when the URL names no source', () => {
    renderAt('')

    expect(screen.getByText('Step 1 of 2')).toBeTruthy()
    expect(screen.getByRole('heading', { name: SOURCE_HEADING })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: FORM_HEADING })).toBeNull()

    const rows = Array.from(
      screen.getByRole('navigation').querySelectorAll('a')
    )
    expect(rows.map((row) => row.getAttribute('href'))).toEqual([
      SHOPIFY_APP_STORE_LISTING_URL,
      '?source=easyorders',
      '?source=standalone',
    ])
    expect(
      screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')
    ).toBe('/en/login')
  })

  it.each(['?source=nope', '?source=shopify', '?source=woocommerce'])(
    'stays on the source step for %s',
    (search) => {
      renderAt(search)

      expect(screen.getByRole('heading', { name: SOURCE_HEADING })).toBeTruthy()
      expect(screen.queryByRole('heading', { name: FORM_HEADING })).toBeNull()
    }
  )

  it('opens the account form with a valid source preselected', async () => {
    renderAt('?source=easyorders')

    expect(screen.getByText('Step 2 of 2')).toBeTruthy()
    expect(screen.getByRole('heading', { name: FORM_HEADING })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: SOURCE_HEADING })).toBeNull()
    expect(screen.getByText('Order source')).toBeTruthy()
    expect(screen.getByText('EasyOrders')).toBeTruthy()

    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
    expect(signUp.mock.calls[0][2]?.metadata).toEqual({
      full_name: 'Ahmed Hafez',
      company_name: 'Noor Store',
      signup_source: 'easyorders',
    })
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith(
        '/en/signup?sent=1&email=ahmed%40noorstore.com&source=easyorders'
      )
    )
    expect(nav.replace.mock.calls[0][0]).not.toContain('secret-pass')
  })

  it('submits no signup_source for no connected store', async () => {
    renderAt('?source=standalone')

    expect(screen.getByText('No connected store')).toBeTruthy()
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
    expect(signUp.mock.calls[0][2]?.metadata).toEqual({
      full_name: 'Ahmed Hafez',
      company_name: 'Noor Store',
    })
  })

  it('returns to the source step from "Change"', () => {
    renderAt('?source=easyorders')

    expect(
      screen
        .getByRole('link', { name: 'Change order source' })
        .getAttribute('href')
    ).toBe('/en/signup')
  })

  it.each(['easyorders', 'standalone'])(
    'shows the free allowance and the price beside the %s form',
    (sourceId) => {
      renderAt(`?source=${sourceId}`)

      const aside = screen.getByRole('complementary', {
        name: 'What happens next',
      })
      expect(aside.textContent).toContain('30 free WhatsApp messages')
      expect(aside.textContent).toContain('Then 2.00 EGP per WhatsApp message')
    }
  )

  it('still shows the verify card for ?sent=1&email=', () => {
    renderAt('?sent=1&email=ahmed%40noorstore.com')

    expect(
      screen.getByRole('heading', {
        name: 'Open your inbox to activate your account',
      })
    ).toBeTruthy()
    expect(screen.getByText('ahmed@noorstore.com')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: SOURCE_HEADING })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))
    expect(nav.replace).toHaveBeenCalledWith('/en/signup')
  })

  it('keeps the source when the email is changed', () => {
    renderAt('?sent=1&email=ahmed%40noorstore.com&source=easyorders')

    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))
    expect(nav.replace).toHaveBeenCalledWith('/en/signup?source=easyorders')
  })
})
