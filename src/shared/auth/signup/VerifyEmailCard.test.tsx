import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/shared/lib/auth'
import { renderAuth } from '../authTestUtils'
import { VerifyEmailCard } from './VerifyEmailCard'

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/auth')>()
  return {
    ...actual,
    auth: { ...actual.auth, resendSignupEmail: vi.fn() },
  }
})

const resendSignupEmail = vi.mocked(auth.resendSignupEmail)

function renderCard() {
  const onChangeEmail = vi.fn()
  renderAuth(
    <VerifyEmailCard
      email="ahmed@noorstore.com"
      locale="ar"
      onChangeEmail={onChangeEmail}
    />
  )
  return { onChangeEmail }
}

describe('VerifyEmailCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resendSignupEmail.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('names the address and lists the next steps', () => {
    renderCard()
    expect(
      screen.getByRole('heading', { name: 'افتح بريدك لتفعيل الحساب' })
    ).toBeTruthy()
    expect(screen.getByText('ahmed@noorstore.com')).toBeTruthy()
    const steps = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(steps).toEqual([
      '1فعّل بريدك من الرابط',
      '2أضف رقم واتساب الخاص بك',
      '3جرّب رسالة التأكيد على هاتفك',
    ])
  })

  it('shows the cooldown, then resends to onboarding with feedback', async () => {
    resendSignupEmail.mockResolvedValue(undefined)
    renderCard()

    const button = screen.getByRole('button', {
      name: /إعادة الإرسال خلال 60 ث/,
    })
    expect((button as HTMLButtonElement).disabled).toBe(true)

    act(() => {
      vi.advanceTimersByTime(18_000)
    })
    expect(
      (
        screen.getByRole('button', {
          name: /إعادة الإرسال خلال 42 ث/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)

    act(() => {
      vi.advanceTimersByTime(42_000)
    })
    const ready = screen.getByRole('button', { name: /^إعادة الإرسال$/ })
    expect((ready as HTMLButtonElement).disabled).toBe(false)

    await act(async () => {
      fireEvent.click(ready)
    })

    expect(resendSignupEmail).toHaveBeenCalledWith(
      'ahmed@noorstore.com',
      `${window.location.origin}/ar/onboarding`
    )
    expect(screen.getByRole('status').textContent).toContain(
      'أرسلنا رابطًا جديدًا'
    )
    expect(
      (
        screen.getByRole('button', {
          name: /إعادة الإرسال خلال 60 ث/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('reports a failed resend', async () => {
    resendSignupEmail.mockRejectedValue(new Error('rate limited'))
    renderCard()
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^إعادة الإرسال$/ }))
    })

    expect(screen.getByRole('status').textContent).toContain(
      'تعذّر إرسال الرابط الآن'
    )
  })

  it('goes back to the form to change the email', () => {
    const { onChangeEmail } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'تغيير البريد' }))
    expect(onChangeEmail).toHaveBeenCalledTimes(1)
  })
})
