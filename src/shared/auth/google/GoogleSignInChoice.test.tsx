import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import {
  isGoogleAuthEnabled,
  startGoogleSignIn,
} from '@/shared/lib/googleOAuth'
import { renderAuth } from '@/shared/auth/authTestUtils'
import { GoogleSignInChoice } from './GoogleSignInChoice'

vi.mock('@/shared/lib/googleOAuth', () => ({
  isGoogleAuthEnabled: vi.fn(),
  startGoogleSignIn: vi.fn(),
}))
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isGoogleAuthEnabled).mockReturnValue(true)
})
it('stays hidden until enabled', () => {
  vi.mocked(isGoogleAuthEnabled).mockReturnValue(false)
  renderAuth(<GoogleSignInChoice locale="en" intent="login" />, 'en')
  expect(screen.queryByRole('button')).toBeNull()
})
it('shows a translated safe error and releases the credential form after failure', async () => {
  const busy = vi.fn()
  vi.mocked(startGoogleSignIn).mockRejectedValue(
    new Error('private diagnostic')
  )
  renderAuth(
    <GoogleSignInChoice
      locale="en"
      intent="signup"
      source="standalone"
      onBusyChange={busy}
    />,
    'en'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  expect((await screen.findByRole('alert')).textContent).not.toContain(
    'private diagnostic'
  )
  expect(busy.mock.calls).toEqual([[true], [false]])
  expect(startGoogleSignIn).toHaveBeenCalledWith({
    locale: 'en',
    intent: 'signup',
    source: 'standalone',
  })
})
