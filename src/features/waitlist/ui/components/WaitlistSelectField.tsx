import type { ReactNode } from 'react'
import type { Control, FieldErrors } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WaitlistFormData } from '@/features/waitlist/model/waitlist.model'
import { Controller } from 'react-hook-form'

interface WaitlistSelectOption {
  value: string
  label: string
}

interface WaitlistSelectFieldProps {
  control: Control<WaitlistFormData>
  errors: FieldErrors<WaitlistFormData>
  label: string
  placeholder: string
  icon: ReactNode
  options: WaitlistSelectOption[]
}

export function WaitlistSelectField({
  control,
  errors,
  label,
  placeholder,
  icon,
  options,
}: WaitlistSelectFieldProps) {
  const hasError = Boolean(errors.monthlyOrders)

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
        {icon}
        <span>{label} *</span>
      </label>
      <Controller
        name="monthlyOrders"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger
              suppressHydrationWarning
              className={`h-12 text-base ${hasError ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {hasError && (
        <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.monthlyOrders?.message?.toString()}</span>
        </div>
      )}
    </div>
  )
}
