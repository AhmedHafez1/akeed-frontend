import type { ReactNode } from 'react'
import { Card } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

interface AuthPanelProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function AuthPanel({
  title,
  description,
  children,
  className,
}: AuthPanelProps) {
  return (
    <Card
      variant="elevated"
      className={cn(
        'rounded-panel border-primary-border bg-card shadow-card p-6 sm:p-8',
        className
      )}
    >
      <div className="space-y-2 text-center">
        <h1 className="text-h2 text-foreground">{title}</h1>
        {description ? (
          <div className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-8">{children}</div> : null}
    </Card>
  )
}
