import type { OrderImportBatchDetail } from '../api/orderImportsApi'

/**
 * The import modal as a small machine:
 * idle → parsing → check → review → importing → sending.
 *
 * The server's batch status stays the source of truth for where a batch is
 * (a refresh lands on the same step, see `flowFromBatch`); this holds what
 * the server does not know -- a file being read, the check's open panels, a
 * merchant going back to the mapping, and whether "import" should also send.
 */
export type FlowPhase =
  | 'idle'
  | 'parsing'
  | 'check'
  | 'review'
  | 'importing'
  | 'sending'

export type FlowState = {
  phase: FlowPhase
  /** The mapping table is open instead of the one-line matched panel. */
  mappingOpen: boolean
  /** The payment buckets are open instead of their one-line summary. */
  paymentOpen: boolean
  /** "استيراد وإرسال": start sending as soon as the import is in. */
  sendAfterImport: boolean
}

export type FlowEvent =
  | { type: 'fileChosen' }
  | { type: 'uploadFailed' }
  | { type: 'checkOpened'; allMatched: boolean }
  | { type: 'editMapping' }
  | { type: 'editPayment' }
  | { type: 'mappingSaved' }
  | { type: 'backToCheck' }
  | { type: 'import'; send: boolean }
  | { type: 'importFailed' }
  | { type: 'imported' }
  | { type: 'sendStarted' }
  | { type: 'restore'; state: FlowState }

export const initialFlow: FlowState = {
  phase: 'idle',
  mappingOpen: false,
  paymentOpen: true,
  sendAfterImport: false,
}

/**
 * The check opens collapsed when everything matched (auto-advance), and on
 * the mapping table otherwise -- where the payment buckets fold to one line
 * so the merchant's attention goes to the column that needs it.
 */
function checkState(state: FlowState, allMatched: boolean): FlowState {
  return {
    ...state,
    phase: 'check',
    mappingOpen: !allMatched,
    paymentOpen: allMatched,
  }
}

export function flowReducer(state: FlowState, event: FlowEvent): FlowState {
  switch (event.type) {
    case 'fileChosen':
      return state.phase === 'idle' ? { ...state, phase: 'parsing' } : state
    case 'uploadFailed':
      return state.phase === 'parsing' ? { ...state, phase: 'idle' } : state
    case 'checkOpened':
      return checkState(state, event.allMatched)
    case 'editMapping':
      return state.phase === 'check' ? { ...state, mappingOpen: true } : state
    case 'editPayment':
      return state.phase === 'check' ? { ...state, paymentOpen: true } : state
    case 'mappingSaved':
      return state.phase === 'check' ? { ...state, phase: 'review' } : state
    case 'backToCheck':
      return state.phase === 'review'
        ? { ...state, phase: 'check', mappingOpen: true, paymentOpen: true }
        : state
    case 'import':
      return state.phase === 'review'
        ? { ...state, phase: 'importing', sendAfterImport: event.send }
        : state
    case 'importFailed':
      return state.phase === 'importing'
        ? { ...state, phase: 'review', sendAfterImport: false }
        : state
    case 'imported':
      return state.phase === 'importing'
        ? { ...state, phase: state.sendAfterImport ? 'sending' : 'review' }
        : state
    case 'sendStarted':
      return { ...state, phase: 'sending' }
    case 'restore':
      return event.state
  }
}

/** Where a batch read from the server (a refresh, a shared link) resumes. */
export function flowFromBatch(
  detail: Pick<OrderImportBatchDetail, 'status' | 'mappingConfirmed'>,
  allMatched: boolean
): FlowState {
  switch (detail.status) {
    case 'draft':
      return detail.mappingConfirmed
        ? { ...initialFlow, phase: 'review' }
        : checkState(initialFlow, allMatched)
    case 'committing':
      return { ...initialFlow, phase: 'importing' }
    case 'releasing':
    case 'paused':
    case 'stopped':
    case 'completed':
      return { ...initialFlow, phase: 'sending' }
    default:
      return { ...initialFlow, phase: 'review' }
  }
}
