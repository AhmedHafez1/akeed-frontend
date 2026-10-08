/**
 * The free-form texts staff manage (US-08-07): the acknowledgment after a
 * customer confirms or cancels, the nudge after an unreadable reply, and the
 * words used for a missing customer or store name. Not WhatsApp templates:
 * they need no review and are saved directly.
 */
export type MessageTextPurpose =
  | 'ack_confirmed'
  | 'ack_canceled'
  | 'unresolved_reply_nudge'
  | 'fallback_customer_name'
  | 'fallback_store_name'

export interface MessageText {
  id: string
  purpose: MessageTextPurpose
  language: 'ar' | 'en'
  /** `default`, or a dialect such as `egyptian` that overrides it. */
  style: string
  body: string
  is_active: boolean
  updated_at: string
}

export interface MessageTextsResponse {
  operations: { enabled: boolean; operator: boolean }
  switches: {
    acknowledgment: boolean
    unresolved_reply_nudge: boolean
    localized_fallbacks: boolean
  }
  options: {
    purposes: MessageTextPurpose[]
    languages: Array<'ar' | 'en'>
    default_style: string
    /** The placeholders each purpose may use. */
    variables: Record<MessageTextPurpose, string[]>
    limits: { body: number; fallback: number }
  }
  texts: MessageText[]
}

export interface MessageTextForm {
  purpose: MessageTextPurpose
  language: 'ar' | 'en'
  style: string
  body: string
  is_active: boolean
}

export interface MessageTextSaveResult {
  change: 'create' | 'update' | 'unchanged'
  text: MessageText
}

export const MESSAGE_TEXT_STYLE_PATTERN = /^[a-z][a-z0-9_]{0,39}$/

/** Texts grouped by purpose, Arabic first, the default style first. */
export function groupMessageTexts(
  texts: readonly MessageText[],
  purposes: readonly MessageTextPurpose[]
): Array<{ purpose: MessageTextPurpose; texts: MessageText[] }> {
  return purposes.map((purpose) => ({
    purpose,
    texts: texts
      .filter((text) => text.purpose === purpose)
      .sort(
        (left, right) =>
          left.language.localeCompare(right.language) ||
          Number(right.style === 'default') -
            Number(left.style === 'default') ||
          left.style.localeCompare(right.style)
      ),
  }))
}
