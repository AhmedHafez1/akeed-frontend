'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { StepProgress, StepRail } from '@/shared/ui'
import {
  completedStepsBefore,
  importSteps,
  type ImportStep,
} from '../../domain/importStep'
import { ImportNotice } from './ImportNotice'

/** Every step heading carries this id so focus can move to it. */
export const IMPORT_STEP_HEADING_ID = 'order-import-step-heading'

/*
 * The last step this tab rendered, kept across client navigations (upload
 * lands on a new route) but not across reloads: a fresh page load leaves
 * focus where the browser puts it, a step change moves it to the heading.
 */
let lastRenderedStep: ImportStep | null = null

function useStepHeadingFocus(step: ImportStep | null) {
  useEffect(() => {
    if (step === null) return
    if (lastRenderedStep !== null && lastRenderedStep !== step)
      document.getElementById(IMPORT_STEP_HEADING_ID)?.focus()
    lastRenderedStep = step
  }, [step])
}

interface ImportWizardShellProps {
  /** Null for full-page states (not found, expired) that sit outside the steps. */
  step: ImportStep | null
  canEdit: boolean
  children: ReactNode
}

export function ImportWizardShell({
  step,
  canEdit,
  children,
}: ImportWizardShellProps) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  useStepHeadingFocus(step)

  const steps = importSteps.map((id, index) => ({
    id,
    marker: index + 1,
    title: t(`steps.${id}`),
  }))
  const completed = step ? completedStepsBefore(step) : new Set<ImportStep>()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-28 md:pb-0">
      <header className="space-y-2">
        <Link
          href={withLocale('/verifications', locale)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t('page.back')}
        </Link>
        <h1 className="text-foreground text-h2 font-bold">{t('page.title')}</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-6">
          {t('page.subtitle')}
        </p>
      </header>

      {step && (
        <>
          <StepRail
            steps={steps}
            currentStep={step}
            completedSteps={completed}
            label={t('steps.label')}
            completedLabel={t('steps.completed')}
            orientation="horizontal"
          />
          <StepProgress
            steps={steps}
            currentStep={step}
            completedSteps={completed}
            label={t('steps.label')}
            progressLabel={t('steps.progress', {
              current: importSteps.indexOf(step) + 1,
              total: importSteps.length,
            })}
          />
        </>
      )}

      {!canEdit && (
        <ImportNotice tone="info" role="status">
          {t('viewer')}
        </ImportNotice>
      )}

      {children}
    </div>
  )
}
