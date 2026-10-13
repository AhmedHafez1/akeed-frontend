/**
 * A WhatsApp template as the backend renders it for a preview: lines of
 * literal text and the places a value goes, plus the reply button labels.
 * The backend reads it from the provider's own text when it can and from its
 * stored copy otherwise (`source`); the client renders both the same way and
 * only fills the values, so a preview shows the merchant's own store name.
 * Shared by the settings editor and the onboarding phones.
 */
export type TemplateMessageVariable =
  | 'customer'
  | 'store'
  | 'order'
  | 'total'
  | TemplateDetailVariable

/** What a detailed template shows of the order: its items and where it ships. */
export type TemplateDetailVariable = 'items' | 'region' | 'address'

export type TemplateMessageSegment =
  | { text: string }
  | { variable: TemplateMessageVariable }

export interface TemplateMessage {
  lines: TemplateMessageSegment[][]
  buttons: string[]
  direction: 'rtl' | 'ltr'
  source: 'provider' | 'registered'
}

/**
 * The values a preview fills in. The order details are optional: a preview
 * that gives none shows the sample order below.
 */
export type TemplateMessageValues = Record<
  Exclude<TemplateMessageVariable, TemplateDetailVariable>,
  string
> &
  Partial<Record<TemplateDetailVariable, string>>

/**
 * The sample order a preview shows in a detailed template, written as a send
 * writes it: the items on one line, then the governorate and the street.
 */
export const TEMPLATE_DETAIL_SAMPLES: Record<
  TemplateMessage['direction'],
  Record<TemplateDetailVariable, string>
> = {
  rtl: {
    items:
      '1. قميص قطن (1x 399) = 399، اللون: أزرق • 2. جورب رياضي (2x 100) = 200',
    region: 'القاهرة',
    address: '12 شارع النيل، المعادي',
  },
  ltr: {
    items:
      '1. Cotton shirt (1x 399) = 399, Color: Blue • 2. Sport socks (2x 100) = 200',
    region: 'Cairo',
    address: '12 Nile Street, Maadi',
  },
}

/** `bold` is set where the template's WhatsApp markers (`*like this*`) bold it. */
export type FilledTemplateSegment =
  | { kind: 'text'; text: string; bold?: true }
  | {
      kind: 'variable'
      variable: TemplateMessageVariable
      text: string
      bold?: true
    }

type BoldUnit =
  | { char: string }
  | { segment: Extract<FilledTemplateSegment, { kind: 'variable' }> }

const WORD_CHARACTER = /[\p{L}\p{N}]/u

/**
 * Reads a line's `*bold*` markers the way WhatsApp does and removes them. A
 * pair counts when the text between starts and ends on a non-space and the
 * pair is not glued to a word outside it; a value between two markers is
 * bold with them. Any other asterisk is shown as written.
 */
function applyBoldMarkers(
  line: FilledTemplateSegment[]
): FilledTemplateSegment[] {
  if (
    !line.some(
      (segment) => segment.kind === 'text' && segment.text.includes('*')
    )
  )
    return line
  const units: BoldUnit[] = line.flatMap((segment): BoldUnit[] =>
    segment.kind === 'text'
      ? Array.from(segment.text, (char) => ({ char }))
      : [{ segment }]
  )
  const isStar = (index: number) => {
    const unit = units[index]
    return unit !== undefined && 'char' in unit && unit.char === '*'
  }
  // A value reads as a word, the line's ends as a space.
  const isSpace = (index: number) => {
    const unit = units[index]
    return unit === undefined || ('char' in unit && /\s/.test(unit.char))
  }
  const isWord = (index: number) => {
    const unit = units[index]
    return (
      unit !== undefined &&
      (!('char' in unit) || WORD_CHARACTER.test(unit.char))
    )
  }
  const canOpen = (index: number) =>
    isStar(index) &&
    !isWord(index - 1) &&
    !isSpace(index + 1) &&
    !isStar(index + 1)
  const canClose = (index: number) =>
    isStar(index) && !isSpace(index - 1) && !isWord(index + 1)

  const markers = new Set<number>()
  const bold = new Set<number>()
  for (let open = 0; open < units.length; open += 1) {
    if (!canOpen(open)) continue
    let close = open + 2
    while (close < units.length && !canClose(close)) close += 1
    if (close >= units.length) continue
    markers.add(open).add(close)
    for (let index = open + 1; index < close; index += 1) bold.add(index)
    open = close
  }
  if (!markers.size) return line

  const result: FilledTemplateSegment[] = []
  units.forEach((unit, index) => {
    if (markers.has(index)) return
    const isBold = bold.has(index)
    if (!('char' in unit)) {
      result.push(isBold ? { ...unit.segment, bold: true } : unit.segment)
      return
    }
    const last = result[result.length - 1]
    if (last?.kind === 'text' && Boolean(last.bold) === isBold) {
      last.text += unit.char
    } else {
      result.push({
        kind: 'text',
        text: unit.char,
        ...(isBold ? { bold: true as const } : {}),
      })
    }
  })
  return result
}

/**
 * Each line with its values in place. A `#` written just before the order
 * number moves into the value, so "#1009" stays one piece inside Arabic text.
 * WhatsApp's bold markers are read and removed (see `applyBoldMarkers`).
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
      let text =
        values[segment.variable] ??
        TEMPLATE_DETAIL_SAMPLES[message.direction][
          segment.variable as TemplateDetailVariable
        ]
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
    return applyBoldMarkers(segments)
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
