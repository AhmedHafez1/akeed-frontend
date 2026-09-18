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
        'border-destructive-border bg-destructive-subtle rounded-2xl border',
        compact ? 'flex items-center gap-3 p-4' : 'p-8 text-center'
      )}
      role="alert"
    >
      <AlertTriangle
        className={cn(
          'text-destructive shrink-0',
          compact ? 'size-5' : 'mx-auto mb-3 size-8'
        )}
      />
      <div className={cn(compact && 'min-w-0 flex-1')}>
        <h2 className="text-destructive-subtle-foreground font-semibold">
          Could not load admin data
        </h2>
        <p className="text-destructive-subtle-foreground mt-1 text-sm">
          {message}
        </p>
        {requestId && (
          <p className="text-destructive-subtle-foreground mt-2 font-mono text-xs">
            Request ID: {requestId}
          </p>
        )}
      </div>
      <Button
        variant={compact ? 'outline' : 'default'}
        className={cn(
          compact
            ? 'border-destructive-border bg-card text-destructive-subtle-foreground hover:bg-destructive-subtle shrink-0'
            : 'mt-5'
        )}
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  )
}
