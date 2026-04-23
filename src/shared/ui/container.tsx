import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div className={cn('container mx-auto', className)} {...props}>
      {children}
    </div>
  )
}
