import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui'

interface AdminErrorPanelProps {
  message: string
  requestId?: string | null
  onRetry: () => void
}

export function AdminErrorPanel({
  message,
  requestId,
  onRetry,
}: AdminErrorPanelProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 size-8 text-red-600" />
      <h2 className="font-semibold text-red-950">Could not load admin data</h2>
      <p className="mt-1 text-sm text-red-800">{message}</p>
      {requestId && (
        <p className="mt-2 font-mono text-xs text-red-700">
          Request ID: {requestId}
        </p>
      )}
      <Button className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
