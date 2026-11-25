/** Mirrors the backend limits on the shipping tag list. */
export const SHIPPING_TAGS_MAX = 10
export const SHIPPING_TAG_MAX_LENGTH = 40

/** Akeed's own order tags (`Akeed: Verified`) never count as shipped. */
const AKEED_TAG_PREFIX = 'akeed:'

/** Why a tag cannot be added; keys under `settings.embedded.shipping.tagErrors`. */
export type ShippingTagError = 'reserved' | 'tooMany' | 'tooLong' | 'duplicate'

/**
 * A tag as the backend compares it: trimmed, compatibility-normalised and
 * lower-cased. Arabic has no case and compares as written.
 */
export function shippingTagKey(tag: string): string {
  return tag.trim().normalize('NFKC').toLowerCase()
}

export function isAkeedTag(tag: string): boolean {
  return shippingTagKey(tag).startsWith(AKEED_TAG_PREFIX)
}

/**
 * Adds the typed tag, or says why it cannot be added. An empty field does
 * nothing. Length is counted in characters, as the backend counts it.
 */
export function addShippingTag(
  tags: readonly string[],
  input: string
): { tags: string[] } | { error: ShippingTagError } | null {
  const tag = input.trim()
  if (!tag) return null
  if ([...tag].length > SHIPPING_TAG_MAX_LENGTH) return { error: 'tooLong' }
  if (isAkeedTag(tag)) return { error: 'reserved' }
  const key = shippingTagKey(tag)
  if (tags.some((saved) => shippingTagKey(saved) === key))
    return { error: 'duplicate' }
  if (tags.length >= SHIPPING_TAGS_MAX) return { error: 'tooMany' }
  return { tags: [...tags, tag] }
}
