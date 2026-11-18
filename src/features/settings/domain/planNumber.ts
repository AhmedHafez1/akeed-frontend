import {
  whatsappTabView,
  type WhatsappConnectionStatus,
  type WhatsappSenderAvailability,
} from '@/features/whatsapp-connect'

export interface PlanNumberState {
  status:
    | 'unknown'
    | 'unconnected'
    | 'preparing'
    | 'disconnected'
    | 'attention'
    | 'partial'
    | 'ready'
  visible: boolean
  connected: boolean
  canConnect: boolean
}

/** Connection presence is distinct from whether its allowance can be used. */
export function resolvePlanNumber(data: {
  availability?: WhatsappSenderAvailability
  connection: WhatsappConnectionStatus | null
  isLoading: boolean
  isError: boolean
}): PlanNumberState {
  const base = {
    visible: Boolean(data.availability?.available || data.connection),
    connected: data.connection?.state === 'active',
    canConnect:
      data.availability?.available === true &&
      data.availability.canConnect === true,
  }
  if (data.isLoading || data.isError) {
    return { ...base, status: 'unknown', canConnect: false }
  }
  const view = whatsappTabView(data.availability, data.connection)
  if (view.kind !== 'connection') return { ...base, status: 'unconnected' }
  const readiness = view.readiness
  return {
    ...base,
    status:
      readiness === 'ready'
        ? 'ready'
        : readiness === 'templatesVary'
          ? 'partial'
          : readiness === 'preparing'
            ? 'preparing'
            : readiness === 'disconnected' || readiness === 'offboarded'
              ? 'disconnected'
              : 'attention',
  }
}
