import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/http'
import { LOGO_MAX_BYTES, logoErrorKey, logoFileProblem } from './merchantLogo'

describe('logoFileProblem', () => {
  it('accepts a PNG or JPEG up to 5 MB', () => {
    expect(logoFileProblem({ type: 'image/png', size: 1000 })).toBeNull()
    expect(
      logoFileProblem({ type: 'image/jpeg', size: LOGO_MAX_BYTES })
    ).toBeNull()
  })

  it('refuses another type before its size', () => {
    expect(logoFileProblem({ type: 'image/webp', size: 1000 })).toBe(
      'unsupportedType'
    )
    expect(logoFileProblem({ type: 'image/svg+xml', size: 1e9 })).toBe(
      'unsupportedType'
    )
  })

  it('refuses a file over 5 MB', () => {
    expect(
      logoFileProblem({ type: 'image/png', size: LOGO_MAX_BYTES + 1 })
    ).toBe('tooLarge')
  })
})

describe('logoErrorKey', () => {
  it.each([
    ['LOGO_FILE_TOO_LARGE', 'tooLarge'],
    ['LOGO_FILE_TYPE_UNSUPPORTED', 'unsupportedType'],
    ['LOGO_IMAGE_UNREADABLE', 'unreadable'],
    ['LOGO_IMAGE_TOO_SMALL', 'tooSmall'],
    ['LOGO_STORAGE_UNAVAILABLE', 'storageUnavailable'],
    ['LOGO_WRITE_FORBIDDEN', 'forbidden'],
    ['LOGO_RATE_LIMITED', 'rateLimited'],
  ])('maps %s to %s', (code, key) => {
    expect(logoErrorKey(new ApiError('x', 400, code))).toBe(key)
  })

  it('falls back to a generic message for anything else', () => {
    expect(logoErrorKey(new ApiError('x', 500, 'SOMETHING_ELSE'))).toBe(
      'generic'
    )
    expect(logoErrorKey(new Error('network'))).toBe('generic')
  })
})
