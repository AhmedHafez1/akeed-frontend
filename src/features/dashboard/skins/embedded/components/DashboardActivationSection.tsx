'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { UpgradePlansModal } from '@/features/billing'
import { createAkeedEmbeddedSupportWhatsAppUrl } from '@/shared/lib/whatsapp'
import { resolveEmbeddedContextFromSearch } from '@/shared/lib/embedded-context'
import type { useDashboardActivation } from '@/features/dashboard/domain/useDashboardActivation'
import { ActivationPanel } from './ActivationPanel'

interface DashboardActivationSectionProps {
  activation: ReturnType<typeof useDashboardActivation>
}

/** Wires the first-run panel to translations, navigation, support and plans. */
export function DashboardActivationSection({
  activation,
}: DashboardActivationSectionProps) {
  const t = useTranslations('dashboard.activation')
  const support = useTranslations('embeddedSupport')
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPlansOpen, setIsPlansOpen] = useState(false)
  const embeddedContext = resolveEmbeddedContextFromSearch(searchParams)

  const state = activation.state
  const doneCount = activation.checklist.filter((item) => item.isDone).length
  const quietStart = state?.quietHoursStart ?? ''
  const quietEnd = state?.quietHoursEnd ?? ''
  const quietHoursEnabled = state?.quietHoursEnabled ?? false

  const handleContactSupport = () => {
    window.open(
      createAkeedEmbeddedSupportWhatsAppUrl({
        defaultMessage: support('defaultMessage'),
        shopLabel: support('shopLabel'),
        pageLabel: support('pageLabel'),
        localeLabel: support('localeLabel'),
        issuePrompt: support('issuePrompt'),
        shopDomain: embeddedContext.shopDomain,
        pathname,
        locale,
      }),
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <>
      <ActivationPanel
        messages={{
          liveBanner: t('liveBanner'),
          pausedBanner: t('pausedBanner'),
          needsPlanTitle: t('needsPlanTitle'),
          needsPlanBody: t('needsPlanBody'),
          choosePlan: t('choosePlan'),
          settings: t('settings'),
          checklistTitle: t('checklist.title'),
          checklistProgress: t('checklist.progress', {
            done: doneCount,
            total: activation.checklist.length,
          }),
          checklistItems: {
            setup: { title: t('checklist.setup') },
            test: {
              title: t('checklist.test'),
              hint: t('checklist.testHint'),
            },
            firstOrder: {
              title: t('checklist.firstOrder'),
              hint: t('checklist.firstOrderHint'),
            },
          },
          tryTest: t('checklist.tryTest'),
          quietHoursTitle: quietHoursEnabled
            ? t('quietHours.onTitle', { start: quietStart, end: quietEnd })
            : t('quietHours.offTitle'),
          quietHoursBody: quietHoursEnabled
            ? t('quietHours.onBody', { end: quietEnd })
            : t('quietHours.offBody'),
          quietHoursAction: quietHoursEnabled
            ? t('quietHours.change')
            : t('quietHours.enable'),
          helpTitle: t('help.title'),
          helpBody: t('help.body'),
          helpAction: t('help.action'),
        }}
        checklist={activation.checklist}
        isLive={activation.isLive}
        needsPlan={activation.needsPlan}
        quietHoursEnabled={quietHoursEnabled}
        onOpenSettings={activation.openSettings}
        onOpenQuietHours={activation.openQuietHours}
        onTryTest={activation.openTest}
        onChoosePlan={() => setIsPlansOpen(true)}
        onContactSupport={handleContactSupport}
      />
      <UpgradePlansModal
        open={isPlansOpen}
        title={t('plansModalTitle')}
        subtitle={t('needsPlanBody')}
        hostParam={embeddedContext.hostParam ?? null}
        onClose={() => setIsPlansOpen(false)}
      />
    </>
  )
}
