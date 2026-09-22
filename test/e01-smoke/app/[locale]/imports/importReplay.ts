/*
 * US-04.6-10 release-gate replay. While `sessionStorage['akeed:e2e-replay']`
 * names a recording, every order-import request and the Verifications list
 * for its batch are answered with what the real backend returned in the
 * PostgreSQL end-to-end test (akeed-backend test/order-import-release-gate.
 * contract-spec.ts), step by step. Refresh `replay/` with
 * `npm run fixtures:import-recording`.
 *
 * Every request, with its body, is kept in `window.__akeedImportReplay.calls`
 * so the Playwright flow can assert what the UI sent and when.
 */
import recording from './replay/arabic-excel.recording.json'

type Json = Record<string, unknown>
type Step = { step: string; body: unknown }
type Stage = 'uploaded' | 'reviewed' | 'committed' | 'releasing' | 'completed'

const REPLAY_KEY = 'akeed:e2e-replay'
const STAGE_KEY = 'akeed:e2e-replay-stage'

const steps = new Map(
  (recording as { steps: Step[] }).steps.map((entry) => [
    entry.step,
    entry.body,
  ])
)
export const replayBatchId = (recording as { batchId: string }).batchId

function body(step: string): unknown {
  if (!steps.has(step)) throw new Error(`Replay has no step ${step}`)
  return steps.get(step)
}

export function isImportReplay(): boolean {
  try {
    return window.sessionStorage.getItem(REPLAY_KEY) === 'arabic-excel'
  } catch {
    return false
  }
}

/** Survives reloads, as the server's state would. */
function stage(): Stage {
  try {
    return (window.sessionStorage.getItem(STAGE_KEY) as Stage) ?? 'uploaded'
  } catch {
    return 'uploaded'
  }
}

function setStage(next: Stage) {
  try {
    window.sessionStorage.setItem(STAGE_KEY, next)
  } catch {
    // The replay then restarts from upload; the flow still asserts it.
  }
}

type ReplayCall = { method: string; url: string; body?: unknown; at: number }
const replayGlobal = globalThis as typeof globalThis & {
  __akeedImportReplay?: { calls: ReplayCall[]; detailReads: number }
}

function state() {
  replayGlobal.__akeedImportReplay ??= { calls: [], detailReads: 0 }
  return replayGlobal.__akeedImportReplay
}

function record(method: string, url: string, requestBody?: unknown) {
  state().calls.push({ method, url, body: requestBody, at: Date.now() })
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status })
}

export async function replayUpload(): Promise<Response> {
  record('POST', '/api/order-imports')
  setStage('uploaded')
  await new Promise((resolve) => setTimeout(resolve, 200))
  return json(body('upload'), 201)
}

export async function replayRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase()
  const requestBody =
    typeof options.body === 'string'
      ? (JSON.parse(options.body) as Json)
      : undefined
  record(method, url, requestBody)
  await new Promise((resolve) => setTimeout(resolve, 80))

  if (url === '/api/order-imports?status=draft')
    return json({ drafts: [], permissions: { canEdit: true } })

  const match = /^\/api\/order-imports\/([^/?]+)(\/[^?]*)?(\?.*)?$/.exec(url)
  if (!match || match[1] !== replayBatchId)
    return json(
      { statusCode: 404, message: 'Not found', code: 'IMPORT_BATCH_NOT_FOUND' },
      404
    )
  const [, , rest = '', query = ''] = match

  if (method === 'GET' && rest === '') {
    const current = stage()
    if (current === 'releasing') {
      // The first read after start shows the release under way, the next
      // one the finished batch, as the release tick got there.
      const reads = ++state().detailReads
      if (reads > 1) setStage('completed')
      return json(body(reads > 1 ? 'detail:completed' : 'start'))
    }
    return json(
      body(
        {
          uploaded: 'detail:uploaded',
          reviewed: 'detail:reviewed',
          committed: 'detail:awaiting_start',
          completed: 'detail:completed',
        }[current]
      )
    )
  }
  if (method === 'PUT' && rest === '/mapping') {
    setStage('reviewed')
    return json(body('mapping'))
  }
  if (method === 'GET' && rest === '/rows') {
    const outcome =
      new URLSearchParams(query.slice(1)).get('outcome') ?? 'ready'
    return json(body(`rows:${outcome}`))
  }
  if (method === 'POST' && rest === '/commit') {
    setStage('committed')
    return json(body('commit'), 202)
  }
  if (method === 'GET' && rest === '/start-quote')
    return json(body('start-quote'))
  if (method === 'POST' && rest === '/start') {
    setStage('releasing')
    state().detailReads = 0
    return json(body('start'), 202)
  }
  throw new Error(`Unexpected replay request: ${method} ${url}`)
}

/** The Verifications list and stats for the replayed batch. */
export function replayVerifications(url: string): unknown | undefined {
  const query = new URL(url, window.location.origin)
  if (query.searchParams.get('importBatchId') !== replayBatchId)
    return undefined
  record('GET', url)
  const list = body(
    stage() === 'completed' ? 'verifications:results' : 'verifications:held'
  ) as Json
  return list
}

/** The release-gate flow's theme, kept across in-app navigation. */
export function e2eTheme(): string | null {
  try {
    return window.sessionStorage.getItem('akeed:e2e-theme')
  } catch {
    return null
  }
}
