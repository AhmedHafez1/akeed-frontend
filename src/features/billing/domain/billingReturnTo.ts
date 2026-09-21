/**
 * Another screen can send the merchant here to buy credits and bring them
 * back afterwards (a bulk import that is short of credits). Paymob returns to
 * the backend-owned `/billing/return` URL, so the destination survives the
 * round trip in session storage.
 *
 * Only known in-app paths are accepted: a `returnTo` from a URL is untrusted
 * input, and anything else would be an open redirect.
 */
const RETURN_TO_PATTERN =
  /^\/imports\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\?start=1)?$/i
const STORAGE_KEY = 'akeed:billing:returnTo'

export function isAllowedReturnTo(value: unknown): value is string {
  return typeof value === 'string' && RETURN_TO_PATTERN.test(value)
}

/** The billing link another screen offers, prefilled with a quantity. */
export function billingPurchaseHref(options: {
  credits: number
  returnTo: string
}): string {
  const query = new URLSearchParams({ credits: String(options.credits) })
  if (isAllowedReturnTo(options.returnTo))
    query.set('returnTo', options.returnTo)
  return `/billing?${query.toString()}`
}

/**
 * A requested quantity made purchasable: rounded up onto the step grid and
 * kept inside the server's range, so the merchant never lands on an amount
 * they cannot buy. `null` when nothing usable was asked for.
 */
export function prefilledQuantity(
  raw: string | null,
  range: { min: number; max: number; step: number }
): number | null {
  if (!raw || !/^\d{1,7}$/.test(raw)) return null
  const requested = Number(raw)
  if (requested <= 0) return null
  const onGrid = Math.ceil(requested / range.step) * range.step
  return Math.min(range.max, Math.max(range.min, onGrid))
}

export function rememberReturnTo(value: string | null): void {
  if (!isAllowedReturnTo(value)) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage can be unavailable (private mode); the link is a convenience.
  }
}

export function readReturnTo(): string | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return isAllowedReturnTo(value) ? value : null
  } catch {
    return null
  }
}

export function forgetReturnTo(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
