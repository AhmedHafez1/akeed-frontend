import { describe, expect, it } from 'vitest'
import { isPublicRoute, isWhatsappConnectRoute } from './locale'

describe('isWhatsappConnectRoute', () => {
  it.each([
    '/ar/whatsapp/connect',
    '/en/whatsapp/connect',
    '/tr/whatsapp/connect/',
  ])('matches %s', (path) => expect(isWhatsappConnectRoute(path)).toBe(true))

  it.each([
    '/ar/whatsapp',
    '/ar/whatsapp/connect/extra',
    '/ar/settings',
    '/whatsapp/connect',
    null,
  ])('does not match %s', (path) => {
    expect(isWhatsappConnectRoute(path)).toBe(false)
  })

  it('is not a marketing route, so it gets its own bare frame', () => {
    expect(isPublicRoute('/ar/whatsapp/connect')).toBe(false)
  })
})
