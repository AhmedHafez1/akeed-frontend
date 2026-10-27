'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { GaugeIcon, LightbulbIcon } from '@shopify/polaris-icons'
import type { TipCardView } from '@/features/tips'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { useHeaderPanels } from '../../../../domain/useHeaderPanels'
import { formatCount } from '../../../../lib/orderDisplay'
import type { MessageUsageView } from '../../../../model/messageUsage.model'
import { HeaderPanel } from './HeaderPanel'
import { HeaderTrigger, type HeaderTriggerTone } from './HeaderTrigger'
import { TipsPanel } from './TipsPanel'
import { UsagePanel } from './UsagePanel'

const USAGE_PANEL_WIDTH = 352
const TIPS_PANEL_WIDTH = 380

export interface HeaderToolsProps {
  panels: ReturnType<typeof useHeaderPanels>
  usage: {
    view: MessageUsageView
    isRefreshing: boolean
    retry: () => void
  }
  tips: {
    cards: TipCardView[]
    canDismiss: boolean
    onSeen: (id: string) => void
    onAction: (id: string) => void
    onDismiss: (id: string) => void
  }
  /** Opens the plan picker; focus comes back to the usage trigger. */
  onChoosePlan: () => void
}

function usageTone(view: MessageUsageView): HeaderTriggerTone {
  if (view.kind !== 'known') return 'neutral'
  if (view.state === 'exhausted') return 'critical'
  if (view.state === 'warning') return 'warning'
  return 'neutral'
}

/**
 * Tips & updates and the messages-left indicator, at the end of the page
 * header on both main tabs. One panel at a time; each overlays the page.
 */
export function HeaderTools({
  panels,
  usage,
  tips,
  onChoosePlan,
}: HeaderToolsProps) {
  const t = useTranslations('dashboard.headerTools')
  const { locale } = useLocaleInfo()
  const usagePanelId = useId()
  const tipsPanelId = useId()
  const { openPanel, toggle, close, usageTriggerRef, tipsTriggerRef } = panels
  const { view } = usage
  // No entries and nothing open: the trigger stays away, as the old section
  // did. An open panel keeps it while its last entry is dismissed.
  const hasUnreadTips = tips.cards.some(
    ({ card }) => card.first_viewed_at === null
  )
  const showTips = tips.cards.length > 0 || openPanel === 'tips'

  const usageLabel =
    view.kind === 'known' && view.limit > 0
      ? t('usage.trigger', {
          count: view.remaining,
          formatted: formatCount(view.remaining, locale),
        })
      : t('usage.triggerUnknown')

  return (
    <>
      {showTips && (
        <>
          <HeaderTrigger
            ref={tipsTriggerRef}
            icon={LightbulbIcon}
            label={t('tips.trigger')}
            iconTone={hasUnreadTips ? 'info' : undefined}
            accessibilityLabel={
              hasUnreadTips ? t('tips.unreadTrigger') : undefined
            }
            expanded={openPanel === 'tips'}
            controls={tipsPanelId}
            onClick={() => toggle('tips')}
          />
          {openPanel === 'tips' && (
            <HeaderPanel
              id={tipsPanelId}
              heading={t('tips.heading')}
              closeLabel={t('close')}
              width={TIPS_PANEL_WIDTH}
              anchorRef={tipsTriggerRef}
              onClose={close}
            >
              <TipsPanel {...tips} />
            </HeaderPanel>
          )}
        </>
      )}
      <HeaderTrigger
        ref={usageTriggerRef}
        icon={GaugeIcon}
        label={usageLabel}
        tone={usageTone(view)}
        loading={view.kind === 'loading'}
        expanded={openPanel === 'usage'}
        controls={usagePanelId}
        onClick={() => toggle('usage')}
      />
      {openPanel === 'usage' && (
        <HeaderPanel
          id={usagePanelId}
          heading={t('usage.heading')}
          closeLabel={t('close')}
          width={USAGE_PANEL_WIDTH}
          anchorRef={usageTriggerRef}
          onClose={close}
        >
          <UsagePanel
            view={view}
            isRefreshing={usage.isRefreshing}
            onRetry={usage.retry}
            onChoosePlan={() => {
              close()
              onChoosePlan()
            }}
          />
        </HeaderPanel>
      )}
    </>
  )
}
