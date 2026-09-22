/*
 * US-04.6-05 order-import fixture. Answers every order-import request in
 * memory with the backend's response shapes (akeed-backend
 * src/modules/order-imports/dto). No authentication, database, upload or
 * message send happens.
 *
 * Query parameters:
 * - scenario: upload refusals on /imports/new (protected, xls, too-many-drafts,
 *   rate-limited, generic, stall, empty); `flag-off` everywhere.
 * - role=viewer: read-only permissions.
 * - theme=dark: dark tokens (applied by the fixture pages).
 * Batch ids: b-map (unconfirmed, ambiguous dates, an unknown payment value,
 * uploaded twice), b-review (confirmed), b-empty (nothing ready), b-expired;
 * committed batches for US-04.6-08: b-imported (awaiting_start), b-releasing,
 * b-paused (out of credits), b-stopped, b-completed, and b-none (completed,
 * but no order of it is visible in Verifications); any other id answers 404.
 */

import { isImportReplay, replayRequest, replayUpload } from './importReplay'

type Json = Record<string, unknown>

const HOUR = 3_600_000
const now = Date.now()
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString()

function params() {
  return new URLSearchParams(window.location.search)
}

export function isOrderImportFixture(): boolean {
  return window.location.pathname.includes('/imports')
}

function canEdit(): boolean {
  return params().get('role') !== 'viewer'
}

function refusal(status: number, code: string, extra: Json = {}): Response {
  return Response.json(
    { statusCode: status, message: `Synthetic ${code}`, code, ...extra },
    { status }
  )
}

const HEADERS = [
  'رقم الطلب',
  'اسم العميل',
  'رقم الموبايل',
  'الإجمالي',
  'طريقة الدفع',
  'التاريخ',
  'المحافظة',
  'ملاحظات المندوب',
  'الوزن',
  'SKU',
]

const SAMPLE_ROWS = [
  [
    '1001',
    'أحمد علي',
    '01012345678',
    '750',
    'الدفع عند الاستلام',
    '12/09/2026',
    'القاهرة',
    '',
    '1.2',
    'A-1',
  ],
  [
    '1002',
    'سارة مصطفى',
    '01198765432',
    '1,250',
    'كاش',
    '13/09/2026',
    'الجيزة',
    '',
    '0.8',
    'B-2',
  ],
  [
    '1003',
    'محمد حسن',
    '01234567890',
    '500',
    'مدفوع',
    '14/09/2026',
    'الإسكندرية',
    '',
    '2',
    'C-3',
  ],
  [
    '1004',
    'منى إبراهيم',
    '01555123456',
    '980',
    'انستاباي',
    '15/09/2026',
    'المنصورة',
    '',
    '1',
    'D-4',
  ],
  [
    '1005',
    'Sara Mostafa',
    '01011122233',
    '1,100',
    'كاش',
    '16/09/2026',
    'Cairo',
    '',
    '1.5',
    'E-5',
  ],
].map((cells, index) => ({
  rowNumber: index + 2,
  raw: Object.fromEntries(HEADERS.map((header, i) => [header, cells[i]])),
  issues: [],
}))

type Field =
  | 'phone'
  | 'customerName'
  | 'amount'
  | 'orderReference'
  | 'currency'
  | 'paymentMethod'
  | 'orderDate'
  | 'city'
  | 'address'
  | 'notes'

function field(
  name: Field,
  columns: string[],
  confidence: 'exact' | 'partial' | 'none',
  source: 'auto' | 'saved' | 'merchant' | 'none'
) {
  return {
    field: name,
    required: ['phone', 'customerName', 'amount'].includes(name),
    columns,
    confidence,
    source,
    alternatives: [],
  }
}

const SUGGESTED_FIELDS = [
  field('phone', ['رقم الموبايل'], 'exact', 'auto'),
  field('customerName', ['اسم العميل'], 'exact', 'auto'),
  field('amount', ['الإجمالي'], 'exact', 'auto'),
  field('orderReference', ['رقم الطلب'], 'exact', 'saved'),
  field('currency', [], 'none', 'none'),
  field('paymentMethod', ['طريقة الدفع'], 'exact', 'auto'),
  field('orderDate', ['التاريخ'], 'exact', 'auto'),
  field('city', ['المحافظة'], 'exact', 'auto'),
  field('address', [], 'none', 'none'),
  field('notes', [], 'none', 'none'),
]

const PAYMENT_VALUES = {
  column: 'طريقة الدفع',
  values: [
    ['الدفع عند الاستلام', 'الدفع عند الاستلام', 812, 'cod'],
    ['كاش', 'كاش', 140, 'cod'],
    ['مدفوع', 'مدفوع', 31, 'not_cod'],
    ['انستاباي', 'انستاباي', 19, 'unknown'],
  ].map(([value, normalizedValue, count, classification]) => ({
    value,
    normalizedValue,
    count,
    classification,
    autoClassification: classification,
    source: 'auto',
  })),
  blankCount: 4,
  distinctCount: 4,
  truncated: false,
}

type FixtureBatch = Json & {
  batchId: string
  status: string
  mappingConfirmed: boolean
  counts: Record<string, number>
}

function batch(
  batchId: string,
  overrides: Partial<FixtureBatch>
): FixtureBatch {
  return {
    batchId,
    shortCode: 'K7Q2XM',
    status: 'draft',
    fileName: 'orders-sept.xlsx',
    format: 'xlsx',
    rowCount: 1002,
    createdAt: iso(-2 * HOUR),
    expiresAt: iso(22 * HOUR),
    headers: HEADERS,
    sampleRows: SAMPLE_ROWS,
    mappingConfirmed: false,
    suggestions: {
      fields: SUGGESTED_FIELDS,
      unmappedColumns: ['ملاحظات المندوب', 'الوزن', 'SKU'],
    },
    options: {
      country: 'EG',
      defaultCurrency: 'EGP',
      dateFormat: 'auto',
      paymentValueMap: {},
    },
    paymentValues: PAYMENT_VALUES,
    dateFormat: { column: 'التاريخ', ambiguous: true, detectedFormat: null },
    counts: {},
    orderDateMin: null,
    orderDateMax: null,
    oldOrderCount: 0,
    permissions: { canEdit: canEdit() },
    ...overrides,
  }
}

const REVIEW_COUNTS = {
  total: 1002,
  ready: 970,
  invalid: 12,
  duplicate: 6,
  excluded: 14,
}

/** A committed batch: 970 orders imported and held, then (maybe) released. */
function committed(
  batchId: string,
  overrides: Partial<FixtureBatch>
): FixtureBatch {
  return batch(batchId, {
    mappingConfirmed: true,
    counts: { ...REVIEW_COUNTS, imported: 970, readyAtCommit: 970 },
    committedAt: iso(-90 * 60_000),
    storeTimezone: 'Africa/Cairo',
    ...overrides,
  })
}

/** Started: when, how fast, and where the 970 orders are now. */
function started(
  status: string,
  release: Record<string, number>,
  lifecycle: Record<string, number>,
  overrides: Partial<FixtureBatch> = {}
): Partial<FixtureBatch> {
  return {
    status,
    startedAt: iso(-45 * 60_000),
    ratePerMinute: 20,
    release: { total: 970, withdrawn: 0, ...release },
    lifecycle: {
      queued: 0,
      sent: 0,
      confirmed: 0,
      canceled: 0,
      noReply: 0,
      failed: 0,
      ...lifecycle,
    },
    ...overrides,
  }
}

const fixtureGlobal = globalThis as typeof globalThis & {
  __akeedOrderImportFixture?: {
    batches: Map<string, FixtureBatch>
    includes: Map<number, boolean>
    drafts: Json[]
    calls: string[]
  }
}

function state() {
  fixtureGlobal.__akeedOrderImportFixture ??= {
    batches: new Map([
      [
        'b-map',
        batch('b-map', {
          duplicateFileOf: {
            batchId: 'b-review',
            createdAt: iso(-12 * 60_000),
            status: 'draft',
          },
        }),
      ],
      [
        'b-review',
        batch('b-review', {
          mappingConfirmed: true,
          options: {
            country: 'EG',
            defaultCurrency: 'EGP',
            dateFormat: 'DMY',
            paymentValueMap: { انستاباي: 'not_cod' },
          },
          counts: { ...REVIEW_COUNTS },
          orderDateMin: '2026-09-12',
          orderDateMax: '2026-09-18',
          oldOrderCount: 14,
        }),
      ],
      [
        'b-empty',
        batch('b-empty', {
          mappingConfirmed: true,
          counts: { total: 3, ready: 0, invalid: 3, duplicate: 0, excluded: 0 },
          suggestions: {
            fields: SUGGESTED_FIELDS.map((entry) =>
              entry.field === 'orderDate'
                ? { ...entry, columns: [], confidence: 'none', source: 'none' }
                : entry
            ),
            unmappedColumns: [],
          },
        }),
      ],
      ['b-expired', batch('b-expired', { status: 'expired' })],
      [
        'b-imported',
        committed('b-imported', {
          status: 'awaiting_start',
          startDeadlineAt: iso(70 * HOUR),
        }),
      ],
      [
        'b-releasing',
        committed(
          'b-releasing',
          started(
            'releasing',
            { held: 610, released: 360 },
            { queued: 20, sent: 140, confirmed: 150, canceled: 12, noReply: 38 }
          )
        ),
      ],
      [
        'b-paused',
        committed(
          'b-paused',
          started(
            'paused',
            { held: 470, released: 500 },
            { sent: 180, confirmed: 250, canceled: 20, noReply: 46, failed: 4 },
            { pausedReason: 'INSUFFICIENT_CREDITS' }
          )
        ),
      ],
      [
        'b-stopped',
        committed(
          'b-stopped',
          started(
            'stopped',
            { held: 0, released: 400, withdrawn: 570 },
            { sent: 60, confirmed: 270, canceled: 24, noReply: 46 },
            { stoppedAt: iso(-10 * 60_000) }
          )
        ),
      ],
      [
        'b-completed',
        committed(
          'b-completed',
          started(
            'completed',
            { held: 0, released: 970 },
            { confirmed: 780, canceled: 64, noReply: 118, failed: 8 },
            { completedAt: iso(-5 * 60_000) }
          )
        ),
      ],
      [
        'b-none',
        committed(
          'b-none',
          started(
            'completed',
            { total: 0, held: 0, released: 0 },
            {},
            {
              fileName: 'orders-empty.csv',
              counts: { ...REVIEW_COUNTS, imported: 0, readyAtCommit: 0 },
              completedAt: iso(-5 * 60_000),
            }
          )
        ),
      ],
    ]),
    includes: new Map(),
    drafts: [
      {
        batchId: 'b-map',
        fileName: 'orders-sept.xlsx',
        rowCount: 1204,
        createdAt: iso(-2 * HOUR),
        expiresAt: iso(22 * HOUR),
      },
    ],
    calls: [],
  }
  return fixtureGlobal.__akeedOrderImportFixture
}

export function orderImportFixtureCalls(): string[] {
  return [...state().calls]
}

const NAMES = [
  'أحمد علي',
  'سارة مصطفى',
  'محمد حسن',
  'منى إبراهيم',
  'Sara Mostafa',
  'Omar Khaled',
  'ياسمين عادل',
  'Mohamed Hassan',
]
const PHONES = [
  '+201012345678',
  '+201198765432',
  '+201234567890',
  '+201555123456',
  '+201011122233',
  '+201099988877',
]

function row(rowNumber: number, outcome: string): Json {
  const name = NAMES[rowNumber % NAMES.length]
  const phone = PHONES[rowNumber % PHONES.length]
  const total = `${(((rowNumber * 37) % 20) + 3) * 50}.00`
  const base = {
    rowNumber,
    raw: {},
    normalized: {
      orderNumber: String(1000 + rowNumber),
      customerPhone: phone,
      customerName: name,
      totalPrice: total,
      currency: 'EGP',
      paymentMethod: 'cash_on_delivery',
      orderDate: `2026-09-${String(12 + (rowNumber % 7)).padStart(2, '0')}`,
    },
    outcome,
    issues: [] as Json[],
    includeOverride: false,
    collapsedInto: null,
  }
  if (outcome === 'invalid') {
    const kind = Math.floor(rowNumber / 3) % 3
    if (kind === 0)
      return {
        ...base,
        raw: { customerName: 'Mohamed Hassan', amount: '500' },
        normalized: null,
        issues: [{ code: 'PHONE_MISSING', field: 'phone' }],
      }
    if (kind === 1)
      return {
        ...base,
        raw: { customerName: 'Sara Ali', phone: '0223456789', amount: '750' },
        normalized: null,
        issues: [{ code: 'PHONE_NOT_MOBILE', field: 'phone' }],
      }
    return {
      ...base,
      normalized: { ...base.normalized, orderNumber: '1042' },
      issues: [
        {
          code: 'ORDER_REF_CONFLICT_IN_FILE',
          field: 'orderReference',
          params: { rowNumber: rowNumber + 4 },
        },
      ],
    }
  }
  if (outcome === 'duplicate')
    return {
      ...base,
      issues:
        rowNumber % 2
          ? [{ code: 'ALREADY_IMPORTED', params: { orderId: 'o-1' } }]
          : [
              {
                code: 'DUPLICATE_IN_FILE',
                params: { rowNumber: rowNumber - 1 },
              },
            ],
    }
  if (outcome === 'excluded' || outcome === 'ready-included') {
    const included = state().includes.get(rowNumber)
    const kind = Math.floor(rowNumber / 3) % 3
    const issues =
      kind === 0
        ? [
            {
              code: 'POSSIBLE_DUPLICATE',
              params: {
                orderNumber: '1042',
                date: '2026-09-16',
                match: 'phone_amount',
              },
            },
          ]
        : kind === 1
          ? [{ code: 'PAYMENT_NOT_COD', field: 'paymentMethod' }]
          : [
              {
                code: 'ORDER_TOO_OLD',
                field: 'orderDate',
                params: { maxAgeDays: 7 },
              },
            ]
    return {
      ...base,
      outcome: included ? 'ready' : 'excluded',
      includeOverride: included ?? false,
      issues,
    }
  }
  return base
}

function rowNumbersFor(batchId: string, outcome: string): number[] {
  const counts = state().batches.get(batchId)?.counts ?? {}
  const offsets: Record<string, number> = {
    invalid: 0,
    duplicate: 100,
    excluded: 200,
    ready: 300,
  }
  const count = counts[outcome] ?? 0
  const numbers = Array.from(
    { length: count },
    (_, i) => offsets[outcome] + i * 3 + 2
  )
  if (outcome === 'ready')
    return [
      ...numbers.slice(
        0,
        count - [...state().includes.values()].filter(Boolean).length
      ),
    ]
  return numbers
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function orderImportFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (isImportReplay()) return replayRequest(url, options)
  const method = (options.method ?? 'GET').toUpperCase()
  const fixture = state()
  fixture.calls.push(`${method} ${url}`)
  await delay(150)
  if (params().get('scenario') === 'flag-off')
    return refusal(403, 'IMPORT_DISABLED')

  if (url === '/api/order-imports?status=draft')
    return Response.json({
      drafts: params().get('scenario') === 'empty' ? [] : fixture.drafts,
      permissions: { canEdit: canEdit() },
    })

  if (url.startsWith('/api/order-imports/template')) {
    const format = new URL(url, 'http://fixture.local').searchParams.get(
      'format'
    )
    return new Response('رقم الطلب,اسم العميل,رقم الموبايل,الإجمالي\r\n', {
      headers: {
        'Content-Type':
          format === 'xlsx' ? 'application/octet-stream' : 'text/csv',
      },
    })
  }

  const match = /^\/api\/order-imports\/([^/?]+)(\/[^?]*)?(\?.*)?$/.exec(url)
  if (!match)
    throw new Error(`Unexpected order-import fixture request: ${method} ${url}`)
  const [, batchId, rest = '', query = ''] = match
  const current = fixture.batches.get(batchId)
  if (!current) return refusal(404, 'IMPORT_BATCH_NOT_FOUND')

  if (method === 'GET' && rest === '')
    return Response.json({ ...current, permissions: { canEdit: canEdit() } })

  if (method === 'DELETE' && rest === '') {
    if (!canEdit()) return refusal(403, 'IMPORT_ROLE_REQUIRED')
    fixture.batches.delete(batchId)
    fixture.drafts = fixture.drafts.filter((draft) => draft.batchId !== batchId)
    return new Response(null, { status: 204 })
  }

  if (method === 'PUT' && rest === '/mapping') {
    if (!canEdit()) return refusal(403, 'IMPORT_ROLE_REQUIRED')
    await delay(700)
    const body = JSON.parse(String(options.body)) as {
      mapping: Record<string, unknown>
      options: Json & {
        dateFormat: string
        paymentValueMap: Record<string, string>
      }
    }
    const fieldErrors: Record<string, string> = {}
    if (body.options.dateFormat === 'auto')
      fieldErrors['options.dateFormat'] = 'Choose the date format.'
    if (!body.options.paymentValueMap['انستاباي'])
      fieldErrors['options.paymentValueMap'] =
        'Choose COD or not COD for every listed payment value.'
    if (Object.keys(fieldErrors).length > 0)
      return refusal(422, 'IMPORT_MAPPING_INCOMPLETE', {
        fieldErrors,
        paymentValues: PAYMENT_VALUES,
        dateFormat: current.dateFormat,
      })
    const counts = { ...REVIEW_COUNTS }
    fixture.batches.set(batchId, {
      ...current,
      mappingConfirmed: true,
      options: body.options,
      counts,
      orderDateMin: '2026-09-12',
      orderDateMax: '2026-09-18',
      oldOrderCount: 14,
    })
    return Response.json({
      batchId,
      status: 'draft',
      counts,
      unmappedColumns: [],
      options: body.options,
      paymentValues: PAYMENT_VALUES,
      dateFormat: current.dateFormat,
    })
  }

  if (method === 'GET' && rest === '/rows') {
    const search = new URLSearchParams(query.slice(1))
    const outcome = search.get('outcome') ?? 'ready'
    const after = Number(search.get('cursor') ?? 0)
    const limit = Number(search.get('limit') ?? 50)
    const numbers =
      outcome === 'ready'
        ? [
            ...[...fixture.includes].filter(([, on]) => on).map(([n]) => n),
            ...rowNumbersFor(batchId, 'ready'),
          ].sort((a, b) => a - b)
        : rowNumbersFor(batchId, outcome).filter(
            (n) => outcome !== 'excluded' || !fixture.includes.get(n)
          )
    const page = numbers.filter((n) => n > after).slice(0, limit)
    const last = page.at(-1)
    return Response.json({
      rows: page.map((n) =>
        fixture.includes.get(n) ? row(n, 'ready-included') : row(n, outcome)
      ),
      nextCursor:
        last !== undefined && numbers.some((n) => n > last)
          ? String(last)
          : null,
    })
  }

  const rowMatch = /^\/rows\/(\d+)$/.exec(rest)
  if (method === 'PATCH' && rowMatch) {
    if (!canEdit()) return refusal(403, 'IMPORT_ROLE_REQUIRED')
    await delay(600)
    if (params().get('include') === 'fail') return refusal(500, 'INTERNAL', {})
    const rowNumber = Number(rowMatch[1])
    const include = (JSON.parse(String(options.body)) as { include: boolean })
      .include
    fixture.includes.set(rowNumber, include)
    const counts = { ...current.counts }
    counts.ready += include ? 1 : -1
    counts.excluded += include ? -1 : 1
    fixture.batches.set(batchId, { ...current, counts })
    return Response.json({ row: row(rowNumber, 'ready-included'), counts })
  }

  throw new Error(`Unexpected order-import fixture request: ${method} ${url}`)
}

/** The credit summary with the bulk-import flag the backend exposes. */
export function orderImportCreditSummary(base: Json): Json {
  return { ...base, bulkImportEnabled: params().get('scenario') !== 'flag-off' }
}

/** The multipart upload: progress ticks, then the scenario's answer. */
export async function orderImportFixtureUpload(options: {
  body: FormData
  signal?: AbortSignal
  onUploadProgress?: (fraction: number) => void
}): Promise<Response> {
  if (isImportReplay()) return replayUpload()
  const fixture = state()
  fixture.calls.push('POST /api/order-imports')
  const scenario = params().get('scenario')
  if (scenario === 'flag-off') return refusal(403, 'IMPORT_DISABLED')
  if (!canEdit()) return refusal(403, 'IMPORT_ROLE_REQUIRED')
  for (const fraction of [0.12, 0.38, 0.64]) {
    if (options.signal?.aborted)
      throw new DOMException('The upload was aborted.', 'AbortError')
    options.onUploadProgress?.(fraction)
    await delay(250)
  }
  if (scenario === 'stall') {
    // Holds at 64% so the uploading frame can be inspected.
    await new Promise<never>((_, reject) =>
      options.signal?.addEventListener('abort', () =>
        reject(new DOMException('The upload was aborted.', 'AbortError'))
      )
    )
  }
  options.onUploadProgress?.(1)
  if (scenario === 'reading') await new Promise(() => undefined)
  await delay(600)
  switch (scenario) {
    case 'protected':
      return refusal(422, 'IMPORT_FILE_PROTECTED')
    case 'xls':
      return refusal(415, 'IMPORT_FILE_TYPE_UNSUPPORTED')
    case 'rows':
      return refusal(422, 'IMPORT_ROW_LIMIT_EXCEEDED')
    case 'rate-limited':
      return refusal(429, 'IMPORT_RATE_LIMITED', { retryAfterSeconds: 42 })
    case 'too-many-drafts':
      return refusal(409, 'IMPORT_TOO_MANY_DRAFTS', {
        drafts: [
          ...fixture.drafts,
          {
            batchId: 'b-review',
            fileName: 'shopify-orders-export.csv',
            rowCount: 318,
            createdAt: iso(-5 * HOUR),
            expiresAt: iso(19 * HOUR),
          },
          {
            batchId: 'b-empty',
            fileName: 'طلبات-الأسبوع.csv',
            rowCount: 3,
            createdAt: iso(-26 * 60_000),
            expiresAt: iso(23 * HOUR),
          },
        ],
      })
    case 'generic':
      return Response.json({ message: 'Synthetic failure' }, { status: 500 })
    default: {
      const file = options.body.get('file')
      fixture.drafts.unshift({
        batchId: 'b-map',
        fileName: file instanceof File ? file.name : 'orders.csv',
        rowCount: 1002,
        createdAt: iso(0),
        expiresAt: iso(24 * HOUR),
      })
      return Response.json(
        { ...batch('b-map', {}), status: 'draft' },
        { status: 201 }
      )
    }
  }
}
