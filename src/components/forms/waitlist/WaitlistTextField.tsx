import type { ReactNode } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { WaitlistFormData } from '@/types/waitlist.model'

interface WaitlistTextFieldProps {
  id: keyof WaitlistFormData
  type: string
  label: string
  placeholder: string
  icon: ReactNode
  register: UseFormRegister<WaitlistFormData>
  errors: FieldErrors<WaitlistFormData>
  required?: boolean
  dir?: 'ltr' | 'rtl'
}

export function WaitlistTextField({
  id,
  type,
  label,
  placeholder,
  icon,
  register,
  errors,
  required,
  dir,
}: WaitlistTextFieldProps) {
  const hasError = Boolean(errors[id])

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700"
      >
        {icon}
        <span>
          {label}
          {required ? ' *' : ''}
        </span>
      </label>
      <Input
        id={id}
        type={type}
        {...register(id)}
        placeholder={placeholder}
        suppressHydrationWarning
        dir={dir}
        className={`h-12 text-base transition-colors ${
          hasError ? 'border-red-500 focus-visible:ring-red-500' : ''
        }`}
      />
      {hasError && (
        <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors[id]?.message?.toString()}</span>
        </div>
      )}
    </div>
  )
}
