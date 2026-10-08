import {
  fillTemplateLines,
  fillTemplateSegments,
  type FilledTemplateSegment,
  type TemplateMessage,
  type TemplateMessageValues,
  type TemplateMessageVariable,
} from '@/shared/lib/templateMessage'

/**
 * Turns a template message into renderable segments. Variables come back as
 * their own segments so the bubble can bold them and render order numbers
 * and totals as left-to-right islands inside Arabic text.
 */

export type PreviewVariable = TemplateMessageVariable

export type PreviewSegment = FilledTemplateSegment

export type PreviewSample = TemplateMessageValues

export const PREVIEW_ORDER_NUMBER = '1009'
export const PREVIEW_TOTAL_AMOUNT = 599
export const PREVIEW_CUSTOMER_NAMES = { ar: 'أحمد', en: 'Ahmed' } as const

const LTR_VARIABLES: ReadonlySet<PreviewVariable> = new Set(['order', 'total'])

export function isLtrVariable(variable: PreviewVariable): boolean {
  return LTR_VARIABLES.has(variable)
}

const OPENING_LINE_MAX_LENGTH = 48

/**
 * The opening of a message as plain text, for the style picker's help text:
 * its first lines, cut at a word boundary.
 */
export function templateOpeningLine(
  message: TemplateMessage,
  sample: PreviewSample
): string {
  const text = fillTemplateLines(message, sample).slice(0, 2).join(' ')
  if (!text) return ''
  if (text.length <= OPENING_LINE_MAX_LENGTH) return `${text}…`
  const cut = text.slice(0, OPENING_LINE_MAX_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}

export function buildPreviewLines(
  message: TemplateMessage,
  sample: PreviewSample
): PreviewSegment[][] {
  return fillTemplateSegments(message, sample).filter(
    (segments) => segments.length > 0
  )
}
