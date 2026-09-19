/** The upload limits the server enforces; checked here only for instant feedback. */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMPORT_EXTENSIONS = ['.csv', '.xlsx'] as const
export const IMPORT_FILE_ACCEPT = ACCEPTED_IMPORT_EXTENSIONS.join(',')

export type PreCheckCode =
  | 'IMPORT_FILE_TYPE_UNSUPPORTED'
  | 'IMPORT_FILE_TOO_LARGE'
  | 'IMPORT_FILE_EMPTY'

/**
 * A quick look at name and size before uploading. The server stays
 * authoritative: it sniffs the content, so a renamed file is still caught.
 */
export function preCheckImportFile(file: {
  name: string
  size: number
}): PreCheckCode | null {
  const name = file.name.toLowerCase()
  if (!ACCEPTED_IMPORT_EXTENSIONS.some((extension) => name.endsWith(extension)))
    return 'IMPORT_FILE_TYPE_UNSUPPORTED'
  if (file.size === 0) return 'IMPORT_FILE_EMPTY'
  if (file.size > MAX_IMPORT_FILE_BYTES) return 'IMPORT_FILE_TOO_LARGE'
  return null
}
