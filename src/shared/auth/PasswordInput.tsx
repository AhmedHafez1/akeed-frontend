'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input, type InputProps } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

export function PasswordInput({ className, ...props }: InputProps) {
  const t = useTranslations()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('rounded-control pe-11', className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        className="text-muted-foreground hover:text-primary absolute inset-y-0 end-0 flex items-center px-3 focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
