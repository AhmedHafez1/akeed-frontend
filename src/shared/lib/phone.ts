import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()

/**
 * `+20 100 761 1456`.
 *
 * libphonenumber groups Egyptian mobiles as `+20 10 07611456`, which merchants
 * do not recognise, so the ten-digit mobile range is grouped 3-3-4 the way it
 * is written locally. Every other number uses the library's international form;
 * anything unparseable is shown as stored.
 */
export function formatPhoneInternational(phone: string | null | undefined) {
  if (!phone) return ''
  const trimmed = phone.trim()
  try {
    const parsed = phoneUtil.parse(
      trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/\D/g, '')}`
    )
    const national = String(parsed.getNationalNumber() ?? '')
    if (parsed.getCountryCode() === 20 && /^1\d{9}$/.test(national)) {
      return `+20 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
    }
    return phoneUtil.format(parsed, PhoneNumberFormat.INTERNATIONAL)
  } catch {
    return trimmed
  }
}
