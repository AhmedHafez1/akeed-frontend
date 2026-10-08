import type {
  TemplateMessage,
  TemplateMessageSegment,
  TemplateMessageVariable,
} from './templateMessage'

const TOKEN = /{{\s*(customer|store|order|total)\s*}}/g

/**
 * A template message for tests and fixtures, written as plain lines with
 * `{{customer}}`-style placeholders, the way a merchant reads it.
 */
export function templateMessageFixture(
  lines: string[],
  buttons: string[],
  options: {
    direction?: TemplateMessage['direction']
    source?: TemplateMessage['source']
  } = {}
): TemplateMessage {
  return {
    lines: lines.map((line) => {
      const segments: TemplateMessageSegment[] = []
      let cursor = 0
      for (const match of line.matchAll(TOKEN)) {
        if (match.index > cursor) {
          segments.push({ text: line.slice(cursor, match.index) })
        }
        segments.push({ variable: match[1] as TemplateMessageVariable })
        cursor = match.index + match[0].length
      }
      if (cursor < line.length) segments.push({ text: line.slice(cursor) })
      return segments
    }),
    buttons,
    direction: options.direction ?? 'ltr',
    source: options.source ?? 'registered',
  }
}
