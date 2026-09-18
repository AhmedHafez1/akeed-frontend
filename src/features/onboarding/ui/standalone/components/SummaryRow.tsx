'use client'

import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StandaloneStep } from '@/features/onboarding/domain/onboarding.types'

interface SummaryRowProps {
  label: string
  value: ReactNode
  /** Step the Edit link returns to. Omit to render the row without an action. */
  editStep?: StandaloneStep
  editStepTitle?: string
  onEdit?: (step: StandaloneStep) => void
}

export function SummaryRow({
  label,
  value,
  editStep,
  editStepTitle,
  onEdit,
}: SummaryRowProps) {
  const t = useTranslations('standaloneOnboarding')

  return (
    <div className="border-border flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b py-4 text-start last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground flex min-w-0 items-center gap-2 text-sm font-medium">
        <span className="min-w-0 text-start">{value}</span>
        {editStep !== undefined && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(editStep)}
            aria-label={
              editStepTitle
                ? t('review.editStep', { step: editStepTitle })
                : undefined
            }
            className="text-primary hover:text-primary-hover focus-visible:ring-ring inline-flex shrink-0 items-center gap-0.5 rounded text-xs font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t('review.edit')}
            <ChevronRight
              aria-hidden="true"
              className="h-3.5 w-3.5 rtl:rotate-180"
            />
          </button>
        )}
      </dd>
    </div>
  )
}
