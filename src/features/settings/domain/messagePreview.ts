import {
  MESSAGE_SAMPLE_CUSTOMER_NAMES,
  formatMessageTotal,
  type MessageLanguage,
} from '@/shared/lib/messageLanguage'
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
 * their own segments so the bubble can render an order number as a
 * left-to-right island inside Arabic text; a segment is bold where the
 * template's WhatsApp markers make it bold.
 */

export type PreviewVariable = TemplateMessageVariable

export type PreviewSegment = FilledTemplateSegment

export type PreviewSample = TemplateMessageValues

export const PREVIEW_ORDER_NUMBER = '1009'
export const PREVIEW_TOTAL_AMOUNT = 599
export const PREVIEW_CUSTOMER_NAMES = MESSAGE_SAMPLE_CUSTOMER_NAMES

/**
 * The total is left to flow with the text, as WhatsApp lays it out: an
 * island would put its currency on the other side of the amount.
 */
const LTR_VARIABLES: ReadonlySet<PreviewVariable> = new Set(['order'])

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

/** The sample order's total, written as a message in that language sends it. */
export function previewTotal(
  currency: string,
  language: MessageLanguage
): string {
  return formatMessageTotal(PREVIEW_TOTAL_AMOUNT, currency, language)
}

export function buildPreviewLines(
  message: TemplateMessage,
  sample: PreviewSample
): PreviewSegment[][] {
  return fillTemplateSegments(message, sample).filter(
    (segments) => segments.length > 0
  )
}
