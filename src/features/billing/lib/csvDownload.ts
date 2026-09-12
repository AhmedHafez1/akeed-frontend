/**
 * Hands a generated CSV to the browser as a file.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * reads the href asynchronously after the click, and revoking in the same task
 * cancels the download.
 */
export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
