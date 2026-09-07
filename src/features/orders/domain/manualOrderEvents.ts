type ManualOrderAcceptedListener = () => void

const listeners = new Set<ManualOrderAcceptedListener>()

export function notifyManualOrderAccepted(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeToManualOrderAccepted(
  listener: ManualOrderAcceptedListener
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
