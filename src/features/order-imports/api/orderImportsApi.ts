import { fetchWithAuth, uploadWithAuth } from '@/shared/lib/auth'
import { ApiError, createApiError, parseJsonResponse } from '@/shared/lib/http'
import type { OrderCurrency } from '@/shared/commerce/orderCommerce'

export type OrderImportFormat = 'csv' | 'xlsx'
export type OrderImportTemplateLocale = 'ar' | 'en'

/** The canonical fields a column can feed (US-04.6-03), required first. */
export const orderImportFields = [
  'phone',
  'customerName',
  'amount',
  'orderReference',
  'currency',
  'paymentMethod',
  'orderDate',
  'city',
  'address',
  'notes',
] as const

export type OrderImportField = (typeof orderImportFields)[number]

export type OrderImportRowIssue = {
  code: string
  field?: string
  params?: Record<string, string | number>
  /** On a column the mapping does not use; does not change the outcome. */
  informational?: true
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

export type OrderImportMatchConfidence = 'exact' | 'partial' | 'none'
export type OrderImportMappingSource = 'auto' | 'saved' | 'merchant' | 'none'
export type OrderImportDateFormat = 'auto' | 'DMY' | 'MDY' | 'YMD'
export type OrderImportPaymentClass = 'cod' | 'not_cod'

export type OrderImportFieldSuggestion = {
  field: OrderImportField
  required: boolean
  columns: string[]
  confidence: OrderImportMatchConfidence
  source: OrderImportMappingSource
  alternatives: string[]
}

export type OrderImportOptions = {
  country: string
  defaultCurrency: OrderCurrency
  dateFormat: OrderImportDateFormat
  /** Keyed by the value's normalized form. */
  paymentValueMap: Record<string, OrderImportPaymentClass>
}

export type OrderImportPaymentValue = {
  value: string
  normalizedValue: string
  count: number
  classification: OrderImportPaymentClass | 'unknown'
  autoClassification: OrderImportPaymentClass | 'unknown'
  source: 'auto' | 'saved' | 'merchant'
}

export type OrderImportPaymentValues = {
  column: string
  values: OrderImportPaymentValue[]
  blankCount: number
  distinctCount: number
  truncated: boolean
}

export type OrderImportDateCheck = {
  column: string
  ambiguous: boolean
  detectedFormat: 'DMY' | 'MDY' | null
}

/** The mapping as upload suggests it or the batch stores it. */
export type OrderImportMappingState = {
  suggestions: {
    fields: OrderImportFieldSuggestion[]
    unmappedColumns: string[]
  }
  options: OrderImportOptions
  paymentValues: OrderImportPaymentValues | null
  dateFormat: OrderImportDateCheck | null
}

/** `POST /api/order-imports` (US-04.6-02 AC8, US-04.6-03). */
export type OrderImportUploadResponse = OrderImportMappingState & {
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
  mappingDictionaryVersion: number
  headerSignature: string
  mappingProfileApplied: boolean
  /** Present when the same file was uploaded in the last 24 hours. A warning, not an error. */
  duplicateFileOf?: OrderImportDuplicateFile
}

export type OrderImportCounts = {
  total?: number
  ready?: number
  invalid?: number
  duplicate?: number
  excluded?: number
  imported?: number
  /** Ready rows at the moment the commit was claimed: the progress total. */
  readyAtCommit?: number
}

export type OrderImportBatchStatus =
  | 'draft'
  | 'committing'
  | 'awaiting_start'
  | 'releasing'
  | 'paused'
  | 'completed'
  | 'stopped'
  | 'not_started'
  | 'expired'
  | 'failed'

/** `GET /api/order-imports/:id`: what the page needs after a refresh. */
export type OrderImportBatchDetail = OrderImportMappingState & {
  batchId: string
  shortCode: string
  status: OrderImportBatchStatus
  fileName: string
  format: string
  rowCount: number
  createdAt: string
  expiresAt: string
  headers: string[]
  sampleRows: OrderImportSampleRow[]
  /** False while the mapping is only the upload's suggestion. */
  mappingConfirmed: boolean
  counts: OrderImportCounts
  orderDateMin: string | null
  orderDateMax: string | null
  oldOrderCount: number
  duplicateFileOf?: OrderImportDuplicateFile
  /** Set once the commit job finishes. */
  committedAt?: string | null
  /** Confirmation must be started before this, or the orders lapse. */
  startDeadlineAt?: string | null
  /** Release progress, present once the batch is committed (US-04.6-07). */
  startedAt?: string | null
  /** A blocker code, or `staff_paused`, while the batch is paused. */
  pausedReason?: string | null
  /** While quiet hours hold sending back: when it resumes. */
  quietHoursUntil?: string | null
  stoppedAt?: string | null
  completedAt?: string | null
  ratePerMinute?: number
  storeTimezone?: string | null
  release?: OrderImportReleaseCounts
  lifecycle?: OrderImportLifecycleCounts
  permissions: { canEdit: boolean }
}

/** Where the batch's orders are in the hold: sent on, still held, or given up. */
export type OrderImportReleaseCounts = {
  total: number
  held: number
  released: number
  withdrawn: number
}

/** The verification lifecycle of the batch's orders, as the M8 pills group it. */
export type OrderImportLifecycleCounts = {
  queued: number
  sent: number
  confirmed: number
  canceled: number
  noReply: number
  failed: number
}

export type OrderImportCreditDenialCode =
  | 'INSUFFICIENT_CREDITS'
  | 'CREDIT_DEBT_OUTSTANDING'
  | 'CREDIT_ACCOUNT_SUSPENDED'
  | 'CREDIT_ACCOUNT_NOT_PROVISIONED'
  | 'PAYMENT_PENDING_RECONCILIATION'

export type OrderImportStartBlockerCode =
  | 'IMPORT_AUTO_VERIFY_DISABLED'
  | 'IMPORT_SETUP_INCOMPLETE'
  | 'IMPORT_PLAN_LIMIT_REACHED'
  | 'IMPORT_START_WINDOW_EXPIRED'
  | OrderImportCreditDenialCode

/** One reason the batch cannot start or resume right now. */
export type OrderImportStartBlocker = {
  code: OrderImportStartBlockerCode
  reason?: string
  shortfall?: number
  suggestedPurchaseCredits?: number
  slotsRemaining?: number
}

/** `GET /api/order-imports/:id/start-quote` (M7). */
export type OrderImportStartQuote = {
  batchId: string
  orders: number
  accountingMode: 'prepaid_credit' | 'periodic_plan'
  creditsAvailable: number | null
  slotsRemaining: number | null
  estimatedCreditsMin: number
  estimatedCreditsMax: number
  ratePerMinute: number
  estimatedDurationMinutes: number
  quietHours: {
    enabled: boolean
    start: string | null
    end: string | null
    timezone: string
  }
  startDeadlineAt: string | null
  blockers: OrderImportStartBlocker[]
  quoteToken: string
  quoteExpiresAt: string
}

/** Listed with `IMPORT_TOO_MANY_DRAFTS`, and by the open-drafts list. */
export type OrderImportOpenDraft = {
  batchId: string
  fileName: string
  rowCount: number
  createdAt: string
  expiresAt: string
}

export type OrderImportDraftList = {
  drafts: OrderImportOpenDraft[]
  permissions: { canEdit: boolean }
}

/** A started import the top bar reports on; its counts come from `GET /:id`. */
export type OrderImportStartedBatch = {
  batchId: string
  fileName: string
  status: OrderImportBatchStatus
  startedAt: string | null
}

export type OrderImportActiveList = { batches: OrderImportStartedBatch[] }

export type OrderImportRowOutcome =
  | 'ready'
  | 'invalid'
  | 'duplicate'
  | 'excluded'
  | 'imported'

export type OrderImportNormalizedOrder = {
  orderNumber?: string
  customerPhone?: string
  customerName?: string
  totalPrice?: string
  currency?: string
  paymentMethod: string
  paymentMethodOriginal?: string
  orderDate?: string
  city?: string
  address?: string
  notes?: string
}

export type OrderImportRow = {
  rowNumber: number
  /** Mapped fields only; two name columns joined by a space. */
  raw: Partial<Record<OrderImportField, string>>
  normalized: OrderImportNormalizedOrder | null
  outcome: OrderImportRowOutcome | null
  issues: OrderImportRowIssue[]
  includeOverride: boolean
  collapsedInto: number | null
}

export type OrderImportRowsPage = {
  rows: OrderImportRow[]
  nextCursor: string | null
}

export type OrderImportRowUpdate = {
  row: OrderImportRow
  counts: OrderImportCounts
}

export type OrderImportColumnMapping = {
  [Field in Exclude<OrderImportField, 'customerName'>]?: string | null
} & { customerName: string[] }

export type SaveOrderImportMappingBody = {
  mapping: OrderImportColumnMapping
  options: OrderImportOptions
}

export type OrderImportMappingSaved = {
  batchId: string
  status: 'draft'
  counts: OrderImportCounts
  unmappedColumns: string[]
  options: OrderImportOptions
  paymentValues: OrderImportPaymentValues | null
  dateFormat: OrderImportDateCheck | null
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
  'IMPORT_BATCH_EXPIRED',
  'IMPORT_BATCH_STATE_CONFLICT',
  'IMPORT_MAPPING_INCOMPLETE',
  'IMPORT_VALIDATION_FAILED',
  'IMPORT_IDEMPOTENCY_KEY_REQUIRED',
  'IMPORT_IDEMPOTENCY_CONFLICT',
  'IMPORT_NOTHING_TO_IMPORT',
  'IMPORT_ROW_NOT_EDITABLE',
  'IMPORT_ROW_PHONE_INVALID',
  'IMPORT_ATTESTATION_REQUIRED',
  'IMPORT_QUOTE_STALE',
  'IMPORT_START_WINDOW_EXPIRED',
  'IMPORT_AUTO_VERIFY_DISABLED',
  'IMPORT_PLAN_LIMIT_REACHED',
  // Start and resume answer the shared credit codes unchanged.
  'INSUFFICIENT_CREDITS',
  'CREDIT_DEBT_OUTSTANDING',
  'CREDIT_ACCOUNT_SUSPENDED',
  'CREDIT_ACCOUNT_NOT_PROVISIONED',
  'PAYMENT_PENDING_RECONCILIATION',
] as const

export type OrderImportErrorCode = (typeof orderImportErrorCodes)[number]

const orderImportErrorCodeSet: ReadonlySet<string> = new Set(
  orderImportErrorCodes
)

type OrderImportErrorExtras = {
  /** The open drafts, on `IMPORT_TOO_MANY_DRAFTS`. */
  drafts?: OrderImportOpenDraft[]
  /** Recomputed checks, on `IMPORT_MAPPING_INCOMPLETE`. */
  paymentValues?: OrderImportPaymentValues | null
  dateFormat?: OrderImportDateCheck | null
  /** A fresh quote, on `IMPORT_QUOTE_STALE`. */
  quote?: OrderImportStartQuote
  /** Every blocker, on a refused start or resume. */
  blockers?: OrderImportStartBlocker[]
  /** The phone issue code (`PHONE_INVALID`, …), on `IMPORT_ROW_PHONE_INVALID`. */
  issue?: string
}

export type OrderImportApiError = ApiError &
  OrderImportErrorExtras & { code?: OrderImportErrorCode }

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
 * `createApiError` keeps code, message and field errors; the extras some
 * codes carry (the draft list, the recomputed mapping checks) are read from a
 * clone of the same body.
 */
async function toOrderImportError(
  response: Response
): Promise<ApiError & OrderImportErrorExtras> {
  const error: ApiError & OrderImportErrorExtras = await createApiError(
    response.clone()
  )
  try {
    const body = await parseJsonResponse<Record<string, unknown>>(response)
    if (Array.isArray(body.blockers))
      error.blockers = body.blockers as OrderImportStartBlocker[]
    if (body.quote && typeof body.quote === 'object')
      error.quote = body.quote as OrderImportStartQuote
    if (Array.isArray(body.drafts))
      error.drafts = body.drafts.filter(isOpenDraft)
    if ('paymentValues' in body)
      error.paymentValues = body.paymentValues as OrderImportPaymentValues
    if ('dateFormat' in body)
      error.dateFormat = body.dateFormat as OrderImportDateCheck
    if (typeof body.issue === 'string') error.issue = body.issue
  } catch {
    // The code alone is enough to show the refusal.
  }
  return error
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toOrderImportError(response)
  return parseJsonResponse<T>(response)
}

const batchPath = (batchId: string) =>
  `/api/order-imports/${encodeURIComponent(batchId)}`

/**
 * Uploads one CSV or XLSX file as a new draft import. It goes out as an XHR
 * so the page can show upload progress; the browser sets the multipart
 * boundary.
 */
export async function uploadOrderImport(
  file: File,
  options: {
    signal?: AbortSignal
    onProgress?: (fraction: number) => void
  } = {}
): Promise<OrderImportUploadResponse> {
  const body = new FormData()
  body.append('file', file, file.name)
  const response = await uploadWithAuth('/api/order-imports', {
    body,
    signal: options.signal,
    onUploadProgress: options.onProgress,
  })
  return readJson<OrderImportUploadResponse>(response)
}

/** The open drafts to resume, and whether the caller may import. */
export async function listOpenOrderImportDrafts(
  signal?: AbortSignal
): Promise<OrderImportDraftList> {
  const response = await fetchWithAuth('/api/order-imports?status=draft', {
    method: 'GET',
    signal,
  })
  return readJson<OrderImportDraftList>(response)
}

/**
 * `GET /api/order-imports?status=active`: imports still sending, and those
 * that finished handing orders over in the last day.
 */
export async function listActiveOrderImports(
  signal?: AbortSignal
): Promise<OrderImportActiveList> {
  const response = await fetchWithAuth('/api/order-imports?status=active', {
    method: 'GET',
    signal,
  })
  return readJson<OrderImportActiveList>(response)
}

export async function getOrderImport(
  batchId: string,
  signal?: AbortSignal
): Promise<OrderImportBatchDetail> {
  const response = await fetchWithAuth(batchPath(batchId), {
    method: 'GET',
    signal,
  })
  return readJson<OrderImportBatchDetail>(response)
}

export const ORDER_IMPORT_ROWS_PAGE_SIZE = 50

export async function getOrderImportRows(
  batchId: string,
  query: {
    outcome?: OrderImportRowOutcome
    cursor?: string | null
    limit?: number
  },
  signal?: AbortSignal
): Promise<OrderImportRowsPage> {
  const params = new URLSearchParams({
    limit: String(query.limit ?? ORDER_IMPORT_ROWS_PAGE_SIZE),
  })
  if (query.outcome) params.set('outcome', query.outcome)
  if (query.cursor) params.set('cursor', query.cursor)
  const response = await fetchWithAuth(
    `${batchPath(batchId)}/rows?${params.toString()}`,
    { method: 'GET', signal }
  )
  return readJson<OrderImportRowsPage>(response)
}

/** Saves the mapping and options; the server then re-validates every row. */
export async function saveOrderImportMapping(
  batchId: string,
  body: SaveOrderImportMappingBody
): Promise<OrderImportMappingSaved> {
  const response = await fetchWithAuth(`${batchPath(batchId)}/mapping`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return readJson<OrderImportMappingSaved>(response)
}

/** Includes or excludes one possible duplicate. */
export async function setOrderImportRowInclude(
  batchId: string,
  rowNumber: number,
  include: boolean
): Promise<OrderImportRowUpdate> {
  const response = await fetchWithAuth(
    `${batchPath(batchId)}/rows/${rowNumber}`,
    { method: 'PATCH', body: JSON.stringify({ include }) }
  )
  return readJson<OrderImportRowUpdate>(response)
}

/**
 * `PATCH /api/order-imports/:id/rows/:rowNumber/phone`: the number a row's
 * phone issue asked for. The server checks it, validates the batch again and
 * answers the row and counts; a bad number is `IMPORT_ROW_PHONE_INVALID`.
 */
export async function fixOrderImportRowPhone(
  batchId: string,
  rowNumber: number,
  phone: string
): Promise<OrderImportRowUpdate> {
  const response = await fetchWithAuth(
    `${batchPath(batchId)}/rows/${rowNumber}/phone`,
    { method: 'PATCH', body: JSON.stringify({ phone }) }
  )
  return readJson<OrderImportRowUpdate>(response)
}

/** Discards a draft and its rows. Answers 204, so there is no body to parse. */
export async function discardOrderImport(
  batchId: string,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetchWithAuth(batchPath(batchId), {
    method: 'DELETE',
    signal,
  })
  if (!response.ok) throw await toOrderImportError(response)
}

/**
 * The key is derived from the batch, not minted per click.
 *
 * A double-click, a refresh and a retry after a timeout therefore all send
 * the same key, which the server answers as a replay rather than a second
 * import. There is nothing to store and nothing to lose on reload.
 */
export function commitIdempotencyKey(batchId: string): string {
  return `commit-${batchId}`
}

/** `POST /api/order-imports/:id/commit`: 202 with the batch as it now is. */
export async function commitOrderImport(
  batchId: string,
  signal?: AbortSignal
): Promise<OrderImportBatchDetail> {
  const response = await fetchWithAuth(`${batchPath(batchId)}/commit`, {
    method: 'POST',
    headers: { 'Idempotency-Key': commitIdempotencyKey(batchId) },
    signal,
  })
  return readJson<OrderImportBatchDetail>(response)
}

/** `GET /api/order-imports/:id/start-quote`: count, cost, pace and blockers. */
export async function getOrderImportStartQuote(
  batchId: string,
  signal?: AbortSignal
): Promise<OrderImportStartQuote> {
  const response = await fetchWithAuth(`${batchPath(batchId)}/start-quote`, {
    method: 'GET',
    signal,
  })
  return readJson<OrderImportStartQuote>(response)
}

/** Derived from the batch, like the commit key, so a double click replays. */
export function startIdempotencyKey(batchId: string): string {
  return `start-${batchId}`
}

/** `POST /api/order-imports/:id/start`: 202 with the releasing batch. */
export async function startOrderImport(
  batchId: string,
  body: { quoteToken: string },
  signal?: AbortSignal
): Promise<OrderImportBatchDetail> {
  const response = await fetchWithAuth(`${batchPath(batchId)}/start`, {
    method: 'POST',
    headers: { 'Idempotency-Key': startIdempotencyKey(batchId) },
    body: JSON.stringify(body),
    signal,
  })
  return readJson<OrderImportBatchDetail>(response)
}

/** `POST /api/order-imports/:id/resume`: continues a paused batch. */
export async function resumeOrderImport(
  batchId: string,
  signal?: AbortSignal
): Promise<OrderImportBatchDetail> {
  const response = await fetchWithAuth(`${batchPath(batchId)}/resume`, {
    method: 'POST',
    signal,
  })
  return readJson<OrderImportBatchDetail>(response)
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
