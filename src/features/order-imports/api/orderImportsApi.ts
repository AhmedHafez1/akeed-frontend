import { fetchWithAuth } from '@/shared/lib/auth'
import { ApiError, createApiError, parseJsonResponse } from '@/shared/lib/http'

export type OrderImportFormat = 'csv' | 'xlsx'
export type OrderImportTemplateLocale = 'ar' | 'en'

export type OrderImportRowIssue = {
  code: string
  field?: string
  params?: Record<string, string | number>
}

export type OrderImportSampleRow = {
  rowNumber: number
  raw: Record<string, string>
  issues: OrderImportRowIssue[]
}

export type OrderImportDuplicateFile = {
  batchId: string
  createdAt: string
  status: string
}

/** `POST /api/order-imports` (US-04.6-02 AC8). */
export type OrderImportUploadResponse = {
  batchId: string
  status: 'draft'
  fileName: string
  format: OrderImportFormat
  encoding: string | null
  delimiter: string | null
  sheetName: string | null
  ignoredSheets: string[]
  headers: string[]
  rowCount: number
  sampleRows: OrderImportSampleRow[]
  /** Present when the same file was uploaded in the last 24 hours. A warning, not an error. */
  duplicateFileOf?: OrderImportDuplicateFile
}

/** Listed with `IMPORT_TOO_MANY_DRAFTS` so the merchant can resume or discard one. */
export type OrderImportOpenDraft = {
  batchId: string
  fileName: string
  rowCount: number
  createdAt: string
  expiresAt: string
}

export const orderImportErrorCodes = [
  'IMPORT_DISABLED',
  'IMPORT_ROLE_REQUIRED',
  'IMPORT_SOURCE_UNSUPPORTED',
  'IMPORT_SETUP_INCOMPLETE',
  'IMPORT_FILE_REQUIRED',
  'IMPORT_FILE_TOO_LARGE',
  'IMPORT_FILE_TYPE_UNSUPPORTED',
  'IMPORT_FILE_PROTECTED',
  'IMPORT_FILE_UNREADABLE',
  'IMPORT_FILE_EMPTY',
  'IMPORT_ROW_LIMIT_EXCEEDED',
  'IMPORT_COLUMN_LIMIT_EXCEEDED',
  'IMPORT_TOO_MANY_DRAFTS',
  'IMPORT_RATE_LIMITED',
  'IMPORT_BATCH_NOT_FOUND',
  'IMPORT_BATCH_STATE_CONFLICT',
  'IMPORT_VALIDATION_FAILED',
] as const

export type OrderImportErrorCode = (typeof orderImportErrorCodes)[number]

const orderImportErrorCodeSet: ReadonlySet<string> = new Set(
  orderImportErrorCodes
)

export type OrderImportApiError = ApiError & {
  code?: OrderImportErrorCode
  /** The open drafts, on `IMPORT_TOO_MANY_DRAFTS`. */
  drafts?: OrderImportOpenDraft[]
}

export function isOrderImportApiError(
  error: unknown
): error is OrderImportApiError {
  return (
    error instanceof ApiError &&
    (error.code === undefined || orderImportErrorCodeSet.has(error.code))
  )
}

function isOpenDraft(value: unknown): value is OrderImportOpenDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Record<string, unknown>
  return (
    typeof draft.batchId === 'string' &&
    typeof draft.fileName === 'string' &&
    typeof draft.rowCount === 'number' &&
    typeof draft.createdAt === 'string' &&
    typeof draft.expiresAt === 'string'
  )
}

/**
 * `createApiError` keeps code, message and field errors; the draft list that
 * `IMPORT_TOO_MANY_DRAFTS` carries is read from a clone of the same body.
 */
async function toOrderImportError(
  response: Response
): Promise<ApiError & { drafts?: OrderImportOpenDraft[] }> {
  const error: ApiError & { drafts?: OrderImportOpenDraft[] } =
    await createApiError(response.clone())
  if (error.code === 'IMPORT_TOO_MANY_DRAFTS') {
    try {
      const body = await parseJsonResponse<{ drafts?: unknown }>(response)
      if (Array.isArray(body.drafts))
        error.drafts = body.drafts.filter(isOpenDraft)
    } catch {
      // The code alone is enough to show the refusal.
    }
  }
  return error
}

/**
 * Uploads one CSV or XLSX file as a new draft import. The body is FormData,
 * so the browser sets the multipart boundary.
 */
export async function uploadOrderImport(
  file: File,
  signal?: AbortSignal
): Promise<OrderImportUploadResponse> {
  const body = new FormData()
  body.append('file', file, file.name)
  const response = await fetchWithAuth('/api/order-imports', {
    method: 'POST',
    body,
    signal,
  })
  if (!response.ok) throw await toOrderImportError(response)
  return parseJsonResponse<OrderImportUploadResponse>(response)
}

/** Discards a draft and its rows. Answers 204, so there is no body to parse. */
export async function discardOrderImport(
  batchId: string,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetchWithAuth(
    `/api/order-imports/${encodeURIComponent(batchId)}`,
    { method: 'DELETE', signal }
  )
  if (!response.ok) throw await toOrderImportError(response)
}

export type OrderImportTemplateFile = {
  blob: Blob
  fileName: string
}

/**
 * Downloads the sample file through an authenticated request, so no token
 * ever travels in a URL.
 */
export async function downloadOrderImportTemplate(
  format: OrderImportFormat,
  locale: OrderImportTemplateLocale,
  signal?: AbortSignal
): Promise<OrderImportTemplateFile> {
  const query = new URLSearchParams({ format, locale })
  const response = await fetchWithAuth(
    `/api/order-imports/template?${query.toString()}`,
    { method: 'GET', signal }
  )
  if (!response.ok) throw await toOrderImportError(response)
  return {
    blob: await response.blob(),
    fileName: `akeed-orders-template-${locale}.${format}`,
  }
}
