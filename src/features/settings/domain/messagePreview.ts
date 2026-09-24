import { fillTemplatePreview } from '@/shared/lib/templatePreview'
import type { MessageTemplatePreview } from '../api/settingsApi'

/**
 * Turns a catalog template preview into renderable segments. Variables come
 * back as their own segments so the bubble can bold them and render order
 * numbers and totals as left-to-right islands inside Arabic text.
 */

export type PreviewVariable = 'customer' | 'store' | 'order' | 'total'

export type PreviewSegment =
  | { kind: 'text'; text: string }
  | { kind: 'variable'; variable: PreviewVariable; text: string }

export interface PreviewSample {
  customer: string
  store: string
  order: string
  total: string
}

export const PREVIEW_ORDER_NUMBER = '1009'
export const PREVIEW_TOTAL_AMOUNT = 599
export const PREVIEW_CUSTOMER_NAMES = { ar: 'أحمد', en: 'Ahmed' } as const

const MARK = String.fromCharCode(1)
const VARIABLE_PATTERN = new RegExp(
  `${MARK}(customer|store|order|total)${MARK}`
)

const LTR_VARIABLES: ReadonlySet<PreviewVariable> = new Set(['order', 'total'])

export function isLtrVariable(variable: PreviewVariable): boolean {
  return LTR_VARIABLES.has(variable)
}

const OPENING_LINE_MAX_LENGTH = 48

/**
 * The start of a template as plain text, for the style picker's help text:
 * the greeting plus the first body line, cut at a word boundary.
 */
export function templateOpeningLine(
  template: MessageTemplatePreview,
  sample: PreviewSample
): string {
  const text = fillTemplatePreview(template, sample).slice(0, 2).join(' ')
  if (text.length <= OPENING_LINE_MAX_LENGTH) return `${text}…`
  const cut = text.slice(0, OPENING_LINE_MAX_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}

export function buildPreviewLines(
  template: MessageTemplatePreview,
  sample: PreviewSample
): PreviewSegment[][] {
  const marked = fillTemplatePreview(template, {
    customer: `${MARK}customer${MARK}`,
    store: `${MARK}store${MARK}`,
    order: `${MARK}order${MARK}`,
    total: `${MARK}total${MARK}`,
  })

  return marked.map((line) => {
    const parts = line.split(VARIABLE_PATTERN)
    const segments: PreviewSegment[] = []
    parts.forEach((part, index) => {
      // `split` with a capture group alternates text, variable, text, ...
      if (index % 2 === 0) {
        if (part) segments.push({ kind: 'text', text: part })
        return
      }
      const variable = part as PreviewVariable
      let text = sample[variable]
      // Keep "#1009" together: the hash belongs inside the LTR island.
      const previous = segments[segments.length - 1]
      if (
        variable === 'order' &&
        previous?.kind === 'text' &&
        previous.text.endsWith('#')
      ) {
        previous.text = previous.text.slice(0, -1)
        if (!previous.text) segments.pop()
        text = `#${text}`
      }
      segments.push({ kind: 'variable', variable, text })
    })
    return segments
  })
}
