import { AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'

interface AdminErrorPanelProps {
  message: string
  requestId?: string | null
  onRetry: () => void
  compact?: boolean
}

export function AdminErrorPanel({
  message,
  requestId,
  onRetry,
  compact = false,
}: AdminErrorPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-red-200 bg-red-50',
        compact ? 'flex items-center gap-3 p-4' : 'p-8 text-center'
      )}
      role="alert"
    >
      <AlertTriangle
        className={cn(
          'shrink-0 text-red-600',
          compact ? 'size-5' : 'mx-auto mb-3 size-8'
        )}
      />
      <div className={cn(compact && 'min-w-0 flex-1')}>
        <h2 className="font-semibold text-red-950">
          Could not load admin data
        </h2>
        <p className="mt-1 text-sm text-red-800">{message}</p>
        {requestId && (
          <p className="mt-2 font-mono text-xs text-red-700">
            Request ID: {requestId}
          </p>
        )}
      </div>
      <Button
        variant={compact ? 'outline' : 'default'}
        className={cn(
          compact
            ? 'shrink-0 border-red-200 bg-white text-red-800 hover:bg-red-100'
            : 'mt-5'
        )}
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  )
}
