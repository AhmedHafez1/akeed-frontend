/** The part of a next-intl translator this helper needs. */
interface StyleLabelTranslator {
  (key: string): string
  has(key: string): boolean
}

/**
 * The name a merchant sees for a message style. The styles come from the
 * settings response, so one added by staff may have no translation yet: it
 * then shows under its own id instead of a missing-message error.
 *
 * A template staff write is a version of a style (`egyptian_v2`). It takes
 * the name of its style, with the version after it so that two versions of
 * one style can be told apart.
 */
export function templateStyleLabel(
  t: StyleLabelTranslator,
  style: string
): string {
  const key = `variantLabels.${style}`
  if (t.has(key)) return t(key)
  const versioned = /^(.+)_v([0-9]+)$/.exec(style)
  if (!versioned) return style
  const baseKey = `variantLabels.${versioned[1]}`
  return t.has(baseKey) ? `${t(baseKey)} ${versioned[2]}` : style
}
