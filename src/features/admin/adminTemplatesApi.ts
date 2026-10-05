import { adminRequest } from './adminApi'
import {
  templateRangeQuery,
  type TemplateDetailResponse,
  type TemplateListResponse,
  type TemplateRange,
  type TemplateSyncRun,
} from './admin-templates.model'

const path = '/api/admin/templates'

export function getAdminTemplates(range: TemplateRange) {
  return adminRequest<TemplateListResponse>(
    `${path}?${templateRangeQuery(range)}`
  )
}

export function getAdminTemplate(key: string, range: TemplateRange) {
  return adminRequest<TemplateDetailResponse>(
    `${path}/${encodeURIComponent(key)}?${templateRangeQuery(range)}`
  )
}

export function runAdminTemplateSync() {
  return adminRequest<TemplateSyncRun>(`${path}/sync`, { method: 'POST' })
}

export function sendAdminTemplateTest(key: string, phone: string) {
  return adminRequest<{ accepted: true }>(
    `${path}/${encodeURIComponent(key)}/test-send`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }
  )
}
