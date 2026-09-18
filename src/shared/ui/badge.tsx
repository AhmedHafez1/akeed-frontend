import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

/*
 * Status tones read the `--*-subtle` token trios from globals.css, so light and
 * dark values live in one place. Keeping the tone → class mapping here stops
 * every call site from hand-rolling its own `bg-primary-subtle text-primary-subtle-foreground`
 * string, which is what billing used to do.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border-input bg-background text-foreground',
        success:
          'border-success-border bg-success-subtle text-success-subtle-foreground',
        warning:
          'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        danger:
          'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
        info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
        neutral: 'border-border bg-muted text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
