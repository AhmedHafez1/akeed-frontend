import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/shared/lib/auth'
import { renderAuth } from './authTestUtils'
import { ResendConfirmationNotice } from './ResendConfirmationNotice'

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/auth')>()
  return {
    ...actual,
    auth: { ...actual.auth, resendSignupEmail: vi.fn() },
  }
})

const resendSignupEmail = vi.mocked(auth.resendSignupEmail)
const message =
  'انتهت صلاحية رابط التفعيل أو استُخدم من قبل. أرسل رابطًا جديدًا إلى بريدك.'

describe('ResendConfirmationNotice', () => {
  beforeEach(() => {
    resendSignupEmail.mockReset()
  })

  it('explains the expired link and resends to the typed email', async () => {
    resendSignupEmail.mockResolvedValue(undefined)
    renderAuth(
      <ResendConfirmationNotice
        message={message}
        email=" ahmed@noorstore.com "
        locale="ar"
        onEmailMissing={vi.fn()}
      />
    )

    expect(screen.getByText(message)).toBeTruthy()
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'أرسل رابطًا جديدًا' })
      )
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
          name: /أعد الإرسال خلال 60 ث/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('asks for the email instead of sending when it is empty', () => {
    const onEmailMissing = vi.fn()
    renderAuth(
      <ResendConfirmationNotice
        message={message}
        email=""
        locale="ar"
        onEmailMissing={onEmailMissing}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'أرسل رابطًا جديدًا' }))
    expect(onEmailMissing).toHaveBeenCalledTimes(1)
    expect(resendSignupEmail).not.toHaveBeenCalled()
  })
})
