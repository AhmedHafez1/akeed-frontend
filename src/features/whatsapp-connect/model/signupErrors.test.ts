import { describe, expect, it } from 'vitest'
import { serverErrorKey } from './signupErrors'

describe('signup account ownership error', () => {
  it('maps an account conflict to its localized message', () => {
    expect(serverErrorKey('WHATSAPP_ACCOUNT_ALREADY_CONNECTED')).toBe(
      'accountAlreadyConnected'
    )
  })
})
