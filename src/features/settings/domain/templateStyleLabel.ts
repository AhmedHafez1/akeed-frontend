/** The part of a next-intl translator this helper needs. */
interface StyleLabelTranslator {
  (key: string): string
  has(key: string): boolean
}

/**
 * The name a merchant sees for a message style. The styles come from the
 * settings response, so one added by staff may have no translation yet: it
 * then shows under its own id instead of a missing-message error.
 */
export function templateStyleLabel(
  t: StyleLabelTranslator,
  style: string
): string {
  const key = `variantLabels.${style}`
  return t.has(key) ? t(key) : style
}
