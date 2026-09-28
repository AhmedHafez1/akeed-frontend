'use client'

import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Progress } from '@/shared/ui'
import {
  completedModalStepsBefore,
  modalSteps,
  type ModalStep,
} from '../../../domain/importStep'

/** الملف · الفحص · الإرسال, inline in the modal header from 640px up. */
export function ImportStepper({ step }: { step: ModalStep | null }) {
  const t = useTranslations('orderImport.modal')
  const completed = completedModalStepsBefore(step)

  return (
    <ol
      aria-label={t('stepsLabel')}
      className="hidden items-center gap-2 sm:flex"
    >
      {modalSteps.map((id, index) => {
        const isCurrent = id === step
        const isDone = completed.has(id)
        return (
          <Fragment key={id}>
            {index > 0 && (
              <li aria-hidden="true" className="flex items-center">
                <span
                  className={cn(
                    'h-0.5 w-6 rounded-full lg:w-8',
                    isDone || isCurrent ? 'bg-primary' : 'bg-border'
                  )}
                />
              </li>
            )}
            <li
              aria-current={isCurrent ? 'step' : undefined}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                  isDone && 'bg-primary border-primary text-primary-foreground',
                  isCurrent &&
                    'bg-primary border-primary text-primary-foreground ring-primary-subtle ring-4',
                  !isDone &&
                    !isCurrent &&
                    'border-border bg-card text-muted-foreground'
                )}
              >
                {isDone ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-sm',
                  isCurrent
                    ? 'text-primary font-semibold'
                    : isDone
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                )}
              >
                {t(`steps.${id}`)}
                {isDone && <span className="sr-only"> ({t('completed')})</span>}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

/** Below 640px: "3 من 3 · الإرسال" over a thin bar instead of the stepper. */
export function ImportStepMeter({ step }: { step: ModalStep | null }) {
  const t = useTranslations('orderImport.modal')
  if (step === null) return null
  const current = modalSteps.indexOf(step) + 1
  const label = t('stepOf', {
    current,
    total: modalSteps.length,
    label: t(`steps.${step}`),
  })
  return (
    <p className="text-muted-foreground text-xs sm:hidden" aria-current="step">
      {label}
    </p>
  )
}

export function ImportStepBar({ step }: { step: ModalStep | null }) {
  const t = useTranslations('orderImport.modal')
  if (step === null) return null
  const current = modalSteps.indexOf(step) + 1
  return (
    <Progress
      value={Math.round((current / modalSteps.length) * 100)}
      aria-label={t('stepsLabel')}
      className="h-1 rounded-none sm:hidden"
    />
  )
}
