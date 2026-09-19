import { downloadBlob } from '@/shared/lib/download'

/** Hands a generated CSV to the browser as a file. */
export function downloadCsv(content: string, filename: string) {
  downloadBlob(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
    filename.endsWith('.csv') ? filename : `${filename}.csv`
  )
}
