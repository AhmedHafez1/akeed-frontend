import { ApiError } from '@/shared/lib/http'
import { getFormatLocale } from '@/shared/lib/locale'

/** What the backend accepts; it checks again after decoding the file. */
export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg'] as const
export const LOGO_ACCEPT_ATTRIBUTE = LOGO_ACCEPTED_TYPES.join(',')
export const LOGO_MAX_BYTES = 5 * 1024 * 1024

/** Message keys under `settings.logo.errors`. */
export type LogoErrorKey =
  | 'tooLarge'
  | 'unsupportedType'
  | 'unreadable'
  | 'tooSmall'
  | 'storageUnavailable'
  | 'forbidden'
  | 'rateLimited'
  | 'planRequired'
  | 'generic'

const ERROR_KEY_BY_CODE: Record<string, LogoErrorKey> = {
  LOGO_FILE_TOO_LARGE: 'tooLarge',
  LOGO_FILE_TYPE_UNSUPPORTED: 'unsupportedType',
  LOGO_FILE_REQUIRED: 'unsupportedType',
  LOGO_IMAGE_UNREADABLE: 'unreadable',
  LOGO_IMAGE_TOO_SMALL: 'tooSmall',
  LOGO_STORAGE_UNAVAILABLE: 'storageUnavailable',
  LOGO_WRITE_FORBIDDEN: 'forbidden',
  LOGO_RATE_LIMITED: 'rateLimited',
  LOGO_PLAN_REQUIRED: 'planRequired',
}

/** A problem the browser can see before uploading, or null. */
export function logoFileProblem(file: {
  type: string
  size: number
}): LogoErrorKey | null {
  if (!(LOGO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return 'unsupportedType'
  }
  if (file.size > LOGO_MAX_BYTES) return 'tooLarge'
  return null
}

/** When the logo last changed, as a date in the interface language. */
export function formatLogoUpdatedAt(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(`${getFormatLocale(locale)}-u-nu-latn`, {
    dateStyle: 'medium',
  }).format(new Date(iso))
}

/** The message key for a failed upload or removal. */
export function logoErrorKey(error: unknown): LogoErrorKey {
  if (error instanceof ApiError && error.code) {
    return ERROR_KEY_BY_CODE[error.code] ?? 'generic'
  }
  return 'generic'
}
