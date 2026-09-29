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
        'rounded-panel border-primary-border bg-card mx-auto w-full max-w-lg p-6 sm:max-w-xl sm:p-7',
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

      {children ? <div className="mt-5">{children}</div> : null}
    </Card>
  )
}
