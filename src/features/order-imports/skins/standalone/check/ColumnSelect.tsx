'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { selectClasses } from '../styles'

/** A native select of the file's columns: phones show their own picker. */
export function ColumnSelect({
  id,
  value,
  headers,
  disabled,
  invalid = false,
  attention = false,
  describedBy,
  label,
  onChange,
}: {
  id: string
  value: string
  headers: readonly string[]
  disabled: boolean
  /** A save error on this field. */
  invalid?: boolean
  /** A required field nobody chose yet: the warning border and halo. */
  attention?: boolean
  describedBy?: string
  label?: string
  onChange: (column: string) => void
}) {
  const t = useTranslations('orderImport.check')
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={invalid || attention || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        data-mapping-error={invalid || attention || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          selectClasses,
          'h-11 sm:h-10',
          attention &&
            'border-warning-border ring-warning-subtle focus:ring-warning-border ring-4',
          invalid && 'border-destructive-border focus:ring-destructive-border',
          !value && 'text-muted-foreground'
        )}
      >
        <option value="">
          {attention ? t('choose') : `— ${t('notInFile')}`}
        </option>
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
      />
    </div>
  )
}
