import { ApiError } from '@/shared/lib/http'
import type { ManualOrderCreateInput } from '@/features/orders/api/manualOrderApi'

type ManualOrderFixtureOutcome =
  | 'success'
  | 'duplicate'
  | 'validation'
  | 'role'
  | 'source'
  | 'entitlement'
  | 'conflict'
  | 'acceptance'
  | 'unexpected'
  | 'network'
  | 'timeout'
  | 'held_success'

interface ManualOrderFixtureCall {
  token: string | null
  payload: ManualOrderCreateInput
}

interface ManualOrderFixtureState {
  calls: ManualOrderFixtureCall[]
  pending?: () => void
}

type ManualOrderFixtureHost = typeof globalThis & {
  __akeedManualOrderFixture?: ManualOrderFixtureState
}

function getFixtureHost(): ManualOrderFixtureHost {
  return (
    typeof window === 'undefined' ? globalThis : window
  ) as ManualOrderFixtureHost
}

function getState(): ManualOrderFixtureState {
  const host = getFixtureHost()
  host.__akeedManualOrderFixture ??= { calls: [] }
  return host.__akeedManualOrderFixture
}

function selectedOutcome(): ManualOrderFixtureOutcome {
  if (typeof document === 'undefined') return 'success'
  const value = (
    document.getElementById('manual-order-fixture-outcome') as HTMLSelectElement
  )?.value
  return (value || 'success') as ManualOrderFixtureOutcome
}

export function manualOrderFixtureSnapshot() {
  const state = getState()
  return {
    calls: state.calls.map((call) => ({ ...call })),
    pending: Boolean(state.pending),
  }
}

export function settleManualOrderFixture() {
  const state = getState()
  state.pending?.()
  state.pending = undefined
}

export function resetManualOrderFixture() {
  getFixtureHost().__akeedManualOrderFixture = { calls: [] }
}

export async function manualOrderFixtureRequest<T>(
  data: unknown,
  options: RequestInit
): Promise<T> {
  const state = getState()
  const headers = new Headers(options.headers)
  state.calls.push({
    token: headers.get('Idempotency-Key'),
    payload: data as ManualOrderCreateInput,
  })

  const outcome = selectedOutcome()
  if (outcome === 'held_success') {
    await new Promise<void>((resolve) => {
      state.pending = resolve
    })
  }
  if (outcome === 'timeout') {
    await new Promise<never>((_resolve, reject) => {
      options.signal?.addEventListener(
        'abort',
        () => reject(new DOMException('Synthetic timeout', 'AbortError')),
        { once: true }
      )
    })
  }
  if (outcome === 'network') {
    throw new TypeError('Synthetic network failure')
  }
  if (outcome === 'validation') {
    throw new ApiError(
      'Manual order validation failed.',
      400,
      'MANUAL_ORDER_VALIDATION_FAILED',
      { customerPhone: 'Phone number is invalid.' }
    )
  }
  if (outcome === 'role') {
    throw new ApiError(
      'Owner or admin role is required.',
      403,
      'MANUAL_ORDER_ROLE_REQUIRED'
    )
  }
  if (outcome === 'source') {
    throw new ApiError(
      'Source unavailable.',
      409,
      'MANUAL_ORDER_SOURCE_UNAVAILABLE'
    )
  }
  if (outcome === 'entitlement') {
    throw new ApiError(
      'Entitlement required.',
      403,
      'MANUAL_ORDER_ENTITLEMENT_REQUIRED'
    )
  }
  if (outcome === 'acceptance') {
    throw new ApiError(
      'Acceptance failed.',
      503,
      'MANUAL_ORDER_ACCEPTANCE_FAILED'
    )
  }
  if (outcome === 'conflict') {
    throw new ApiError(
      'The retry key belongs to different content.',
      409,
      'MANUAL_ORDER_IDEMPOTENCY_CONFLICT'
    )
  }
  if (outcome === 'unexpected') {
    throw new ApiError('Synthetic server failure.', 500, 'SYNTHETIC_FAILURE')
  }

  return {
    orderId: 'manual-order-fixture-order-id',
    verificationId: 'manual-order-fixture-verification-id',
    status: 'accepted',
    duplicate: outcome === 'duplicate',
  } as T
}
