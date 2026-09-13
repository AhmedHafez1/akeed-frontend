import type { SettingsTemplatePreview } from '@/features/settings/domain/settings.types'
import type { CodTemplateDefinition } from '@/features/settings/api/settingsApi'

export type TemplatePreviewVariableKey =
  CodTemplateDefinition['bodyParameterOrder'][number]

const PREVIEW_CUSTOMER_NAME = 'Ahmed'
const PREVIEW_ORDER_NUMBER = '1009'
const PREVIEW_TOTAL = '599$'

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

export function getTemplatePreviewParagraphs(
  template: SettingsTemplatePreview,
  storeName: string
): string[] {
  const resolvedStoreName = storeName.trim() || 'Akeed Store'

  const replacedBlocks = [
    template.greeting,
    template.body,
    template.totalLabel,
    template.ending,
  ].map((block) => {
    let next = block
    next = applyTokenPatterns(
      next,
      TOKEN_PATTERNS.customer,
      PREVIEW_CUSTOMER_NAME
    )
    next = applyTokenPatterns(next, TOKEN_PATTERNS.store, resolvedStoreName)
    next = applyTokenPatterns(next, TOKEN_PATTERNS.order, PREVIEW_ORDER_NUMBER)
    return applyTokenPatterns(next, TOKEN_PATTERNS.total, PREVIEW_TOTAL)
  })

  return replacedBlocks
    .flatMap((block) => block.split(/\r?\n/g))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function formatTemplatePreviewTimestamp(language: 'ar' | 'en'): string {
  return language === 'ar' ? '8:08 ص' : '8:08 AM'
}

export function getTemplatePreviewVariableKeys(
  bodyParameterOrder?: ReadonlyArray<TemplatePreviewVariableKey>
): TemplatePreviewVariableKey[] {
  return [...new Set(bodyParameterOrder ?? [])]
}
