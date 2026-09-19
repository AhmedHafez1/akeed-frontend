/**
 * Hands a file the app already holds to the browser as a download.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * reads the href asynchronously after the click, and revoking in the same task
 * cancels the download.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
