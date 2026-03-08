import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button, ButtonProps } from './button'
import { cn } from '@/shared/lib/utils'

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, children, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        className={cn(className)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'

export { LoadingButton }