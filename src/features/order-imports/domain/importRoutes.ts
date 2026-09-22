/**
 * The filtered Verifications list for one import: the only place imported
 * orders are shown (US-04.6-08). Every batch view links here through this, so
 * the filter parameter has one spelling. Callers wrap it in `withLocale`.
 */
export function importOrdersPath(batchId: string) {
  return `/verifications?importBatchId=${encodeURIComponent(batchId)}`
}
