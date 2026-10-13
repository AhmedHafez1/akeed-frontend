import type { MessageLanguage } from '@/shared/lib/messageLanguage'

/** The part of a next-intl translator this helper needs. */
interface StyleLabelTranslator {
  (key: string): string
  has(key: string): boolean
}

const VERSIONED_STYLE = /^(.+)_v([0-9]+)$/

/** `egyptian_v2` is a version of `egyptian`. */
function styleOf(id: string): string {
  return VERSIONED_STYLE.exec(id)?.[1] ?? id
}

/**
 * The name a merchant sees for a message style. The styles come from the
 * settings response, so one added by staff may have no translation yet: it
 * then shows under its own id instead of a missing-message error.
 *
 * A template staff write is a version of a style (`egyptian_v2`). It takes
 * the name of its style, with the version after it so that two versions of
 * one style can be told apart.
 *
 * Given the styles listed beside it (`siblings`), a version drops its number
 * while it is the only one of its style on screen.
 *
 * In Arabic the `standard` style is Modern Standard Arabic, as opposed to
 * the dialects. Any other language's `standard` is only its plain wording,
 * so it is named without the Arabic term.
 */
export function templateStyleLabel(
  t: StyleLabelTranslator,
  style: string,
  language: MessageLanguage = 'ar',
  siblings?: readonly string[]
): string {
  const keyOf = (name: string) =>
    `variantLabels.${name === 'standard' && language !== 'ar' ? 'standardPlain' : name}`
  const key = keyOf(style)
  if (t.has(key)) return t(key)
  const versioned = VERSIONED_STYLE.exec(style)
  if (!versioned) return style
  const baseKey = keyOf(versioned[1])
  if (!t.has(baseKey)) return style
  const isOnlyVersion =
    siblings !== undefined &&
    !siblings.some(
      (sibling) => sibling !== style && styleOf(sibling) === versioned[1]
    )
  return isOnlyVersion ? t(baseKey) : `${t(baseKey)} ${versioned[2]}`
}
