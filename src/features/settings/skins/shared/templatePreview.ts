import type { SettingsTemplatePreview } from '@/features/settings/domain/settings.types'
import type { CodTemplateDefinition } from '@/features/settings/api/settingsApi'
import { fillTemplatePreview } from '@/shared/lib/templatePreview'

export type TemplatePreviewVariableKey =
  CodTemplateDefinition['bodyParameterOrder'][number]

const PREVIEW_CUSTOMER_NAME = 'Ahmed'
const PREVIEW_ORDER_NUMBER = '1009'
const PREVIEW_TOTAL = '599$'

export function getTemplatePreviewParagraphs(
  template: SettingsTemplatePreview,
  storeName: string
): string[] {
  return fillTemplatePreview(template, {
    customer: PREVIEW_CUSTOMER_NAME,
    store: storeName.trim() || 'Akeed Store',
    order: PREVIEW_ORDER_NUMBER,
    total: PREVIEW_TOTAL,
  })
}

export function formatTemplatePreviewTimestamp(language: 'ar' | 'en'): string {
  return language === 'ar' ? '8:08 ص' : '8:08 AM'
}

export function getTemplatePreviewVariableKeys(
  bodyParameterOrder?: ReadonlyArray<TemplatePreviewVariableKey>
): TemplatePreviewVariableKey[] {
  return [...new Set(bodyParameterOrder ?? [])]
}
