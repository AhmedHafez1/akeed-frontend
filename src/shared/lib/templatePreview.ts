/**
 * Fills the variables of a COD template preview. The backend owns the template
 * text; this only substitutes sample values so a preview reads like a real
 * message. Shared by the settings editor and the onboarding test phone.
 */
export interface TemplatePreviewBlocks {
  greeting: string
  body: string
  totalLabel: string
  ending: string
}

export interface TemplatePreviewValues {
  customer: string
  store: string
  order: string
  total: string
}

const TOKEN_PATTERNS = {
  customer: [
    /{{\s*customer\s*}}/gi,
    /{{\s*customer_name\s*}}/gi,
    /{\s*customer\s*}/gi,
    /{\s*customer_name\s*}/gi,
    /#\{\s*customer_name\s*\}/gi,
  ],
  store: [
    /{{\s*store\s*}}/gi,
    /{{\s*store_name\s*}}/gi,
    /{\s*store\s*}/gi,
    /{\s*store_name\s*}/gi,
    /#\{\s*store_name\s*\}/gi,
  ],
  order: [
    /{{\s*order\s*}}/gi,
    /{{\s*order_number\s*}}/gi,
    /{\s*order\s*}/gi,
    /{\s*order_number\s*}/gi,
    /#\{\s*order_number\s*\}/gi,
  ],
  total: [
    /{{\s*total\s*}}/gi,
    /{{\s*total_price\s*}}/gi,
    /{\s*total\s*}/gi,
    /{\s*total_price\s*}/gi,
    /#\{\s*total\s*\}/gi,
  ],
} as const

function applyTokenPatterns(
  value: string,
  patterns: ReadonlyArray<RegExp>,
  replacement: string
): string {
  return patterns.reduce((result, pattern) => {
    return result.replace(pattern, replacement)
  }, value)
}

export function fillTemplatePreview(
  template: TemplatePreviewBlocks,
  values: TemplatePreviewValues
): string[] {
  return [
    template.greeting,
    template.body,
    template.totalLabel,
    template.ending,
  ]
    .map((block) => {
      let next = applyTokenPatterns(
        block,
        TOKEN_PATTERNS.customer,
        values.customer
      )
      next = applyTokenPatterns(next, TOKEN_PATTERNS.store, values.store)
      next = applyTokenPatterns(next, TOKEN_PATTERNS.order, values.order)
      return applyTokenPatterns(next, TOKEN_PATTERNS.total, values.total)
    })
    .flatMap((block) => block.split(/\r?\n/g))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
