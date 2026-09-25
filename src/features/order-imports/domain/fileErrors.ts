import type { OrderImportErrorCode } from '../api/orderImportsApi'

/** The one thing the merchant can do about a refused file. */
export type FileErrorAction =
  | 'chooseAnother'
  | 'retry'
  | 'openSettings'
  | 'backToOrders'
  | 'contactSupport'

export type FileErrorDescription = {
  /** `orderImport.fileErrors.<key>.title` and `.body`. */
  key: FileErrorKey
  action: FileErrorAction
  /** Unknown refusals show a reference the merchant can quote to support. */
  showReference: boolean
}

/** Every refusal the upload path can answer (epic contract summary). */
const fileErrorActions = {
  IMPORT_FILE_REQUIRED: 'chooseAnother',
  IMPORT_FILE_TOO_LARGE: 'chooseAnother',
  IMPORT_FILE_TYPE_UNSUPPORTED: 'chooseAnother',
  IMPORT_FILE_PROTECTED: 'chooseAnother',
  IMPORT_FILE_UNREADABLE: 'chooseAnother',
  IMPORT_FILE_EMPTY: 'chooseAnother',
  IMPORT_ROW_LIMIT_EXCEEDED: 'chooseAnother',
  IMPORT_COLUMN_LIMIT_EXCEEDED: 'chooseAnother',
  // Only other members' drafts count (an upload replaces the caller's own),
  // so the way out is waiting for them.
  IMPORT_TOO_MANY_DRAFTS: 'retry',
  IMPORT_RATE_LIMITED: 'retry',
  IMPORT_DISABLED: 'backToOrders',
  IMPORT_ROLE_REQUIRED: 'backToOrders',
  IMPORT_SOURCE_UNSUPPORTED: 'contactSupport',
  IMPORT_SETUP_INCOMPLETE: 'openSettings',
} as const satisfies Partial<Record<OrderImportErrorCode, FileErrorAction>>

export type FileErrorKey = keyof typeof fileErrorActions | 'generic'

export const fileErrorCodes = Object.keys(fileErrorActions) as Array<
  keyof typeof fileErrorActions
>

export function describeFileError(
  code: string | undefined
): FileErrorDescription {
  if (code && code in fileErrorActions) {
    const key = code as keyof typeof fileErrorActions
    return { key, action: fileErrorActions[key], showReference: false }
  }
  return { key: 'generic', action: 'retry', showReference: true }
}
