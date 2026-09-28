/**
 * The filtered Verifications list for one import: the only place imported
 * orders are shown (US-04.6-08). Every batch view links here through this, so
 * the filter parameter has one spelling. Callers wrap it in `withLocale`.
 */
export function importOrdersPath(batchId: string) {
  return `/verifications?importBatchId=${encodeURIComponent(batchId)}`
}

/** The search parameter that opens the import modal on Verifications. */
export const IMPORT_PARAM = 'import'
/** The review step's tab; it means nothing outside that batch. */
const IMPORT_OUTCOME_PARAM = 'outcome'
/** Where Buy credits sends the merchant back to: reopen the start step. */
export const IMPORT_START_PARAM = 'start'

export type ImportModalTarget =
  | { kind: 'new' }
  | { kind: 'batch'; batchId: string }

const BATCH_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** What `?import=` asks for: a new file, one batch, or nothing (closed). */
export function readImportTarget(
  params: Pick<URLSearchParams, 'get'>
): ImportModalTarget | null {
  const value = params.get(IMPORT_PARAM)
  if (value === 'new') return { kind: 'new' }
  if (value && BATCH_ID.test(value)) return { kind: 'batch', batchId: value }
  return null
}

/**
 * The same query with the modal pointed at `target` (or closed). Other
 * parameters -- the list's filters -- are kept; `start` and the review tab
 * only live as long as the batch they were meant for.
 */
export function withImportTarget(
  params: URLSearchParams | string,
  target: ImportModalTarget | null,
  options: { start?: boolean } = {}
): string {
  const next = new URLSearchParams(params)
  next.delete(IMPORT_START_PARAM)
  if (target?.kind !== 'batch') next.delete(IMPORT_OUTCOME_PARAM)
  if (target === null) next.delete(IMPORT_PARAM)
  else next.set(IMPORT_PARAM, target.kind === 'new' ? 'new' : target.batchId)
  if (target?.kind === 'batch' && options.start)
    next.set(IMPORT_START_PARAM, '1')
  const query = next.toString()
  return query ? `?${query}` : ''
}

/** The Verifications route with the import modal open. Wrap in `withLocale`. */
export function importModalPath(
  target: 'new' | string,
  options: { start?: boolean } = {}
): string {
  return `/verifications${withImportTarget(
    '',
    target === 'new' ? { kind: 'new' } : { kind: 'batch', batchId: target },
    options
  )}`
}
