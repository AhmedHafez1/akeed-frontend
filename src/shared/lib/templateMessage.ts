/**
 * A WhatsApp template as the backend renders it for a preview: lines of
 * literal text and the places a value goes, plus the reply button labels.
 * The backend reads it from the provider's own text when it can and from its
 * stored copy otherwise (`source`); the client renders both the same way and
 * only fills the values, so a preview shows the merchant's own store name.
 * Shared by the settings editor and the onboarding phones.
 */
export type TemplateMessageVariable = 'customer' | 'store' | 'order' | 'total'

export type TemplateMessageSegment =
  | { text: string }
  | { variable: TemplateMessageVariable }

export interface TemplateMessage {
  lines: TemplateMessageSegment[][]
  buttons: string[]
  direction: 'rtl' | 'ltr'
  source: 'provider' | 'registered'
}

export type TemplateMessageValues = Record<TemplateMessageVariable, string>

export type FilledTemplateSegment =
  | { kind: 'text'; text: string }
  | { kind: 'variable'; variable: TemplateMessageVariable; text: string }

/**
 * Each line with its values in place. A `#` written just before the order
 * number moves into the value, so "#1009" stays one piece inside Arabic text.
 */
export function fillTemplateSegments(
  message: TemplateMessage,
  values: TemplateMessageValues
): FilledTemplateSegment[][] {
  return message.lines.map((line) => {
    const segments: FilledTemplateSegment[] = []
    for (const segment of line) {
      if ('text' in segment) {
        if (segment.text) segments.push({ kind: 'text', text: segment.text })
        continue
      }
      let text = values[segment.variable]
      const previous = segments[segments.length - 1]
      if (
        segment.variable === 'order' &&
        previous?.kind === 'text' &&
        previous.text.endsWith('#')
      ) {
        previous.text = previous.text.slice(0, -1)
        if (!previous.text) segments.pop()
        if (!text.startsWith('#')) text = `#${text}`
      }
      segments.push({ kind: 'variable', variable: segment.variable, text })
    }
    return segments
  })
}

/** Each line as plain text, with its values in place. */
export function fillTemplateLines(
  message: TemplateMessage,
  values: TemplateMessageValues
): string[] {
  return fillTemplateSegments(message, values)
    .map((segments) => segments.map((segment) => segment.text).join(''))
    .filter((line) => line.trim().length > 0)
}

/**
 * The tone of a reply button. Akeed's templates put Confirm first and Cancel
 * second; anything after them reads as a cancel-style reply.
 */
export function templateReplyTone(index: number): 'confirm' | 'cancel' {
  return index === 0 ? 'confirm' : 'cancel'
}
