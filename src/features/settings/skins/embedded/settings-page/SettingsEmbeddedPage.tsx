'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Banner,
  BlockStack,
  Card,
  Layout,
  Page,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
  Tabs,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import {
  SETTINGS_FIELD_ID,
  SETTINGS_FIELD_TAB,
  type SettingsFieldKey,
} from '@/features/settings/domain/settingsForm'
import {
  isCanonicalSettingsTab,
  resolveSettingsTab,
  SETTINGS_TABS,
  type SettingsTabId,
} from '@/features/settings/domain/settingsTabs'
import { useEmbeddedSettings } from '@/features/settings/domain/useEmbeddedSettings'
import { AppBridgeSaveBar } from '@/shared/ui/app-bridge/AppBridgeSaveBar'
import { MessageTab } from './MessageTab'
import { PlanTab } from './PlanTab'
import { TimingTab } from './TimingTab'

const SAVE_BAR_ID = 'akeed-settings-save-bar'

export function SettingsEmbeddedSkeleton({ title }: { title: string }) {
  return (
    <SkeletonPage title={title}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={3} />
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <SkeletonBodyText lines={6} />
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  )
}

export function SettingsEmbeddedPage() {
  const t = useTranslations('settings.embedded')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const model = useEmbeddedSettings()
  // The field to focus once its tab has rendered after a failed save.
  const pendingFocus = useRef<SettingsFieldKey | null>(null)

  const tabParam = searchParams.get('tab')
  const activeTab = resolveSettingsTab(tabParam)

  const goToTab = useCallback(
    (tab: SettingsTabId, mode: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      const href = `${pathname}?${params.toString()}`
      if (mode === 'replace') router.replace(href)
      else router.push(href)
    },
    [pathname, router, searchParams]
  )

  // Old tab ids (store, confirmation, message-preview, billing, ...) land on
  // the tab that now holds their fields, without adding a history entry.
  useEffect(() => {
    if (!isCanonicalSettingsTab(tabParam)) goToTab(activeTab, 'replace')
  }, [activeTab, goToTab, tabParam])

  // Focus a field on another tab once that tab has rendered.
  useEffect(() => {
    const field = pendingFocus.current
    if (!field || SETTINGS_FIELD_TAB[field] !== activeTab) return
    document.getElementById(SETTINGS_FIELD_ID[field])?.focus()
    pendingFocus.current = null
  }, [activeTab])

  const handleSave = useCallback(async () => {
    const outcome = await model.save()
    if (outcome.ok || !outcome.invalidField) return
    const tab = SETTINGS_FIELD_TAB[outcome.invalidField]
    if (tab === activeTab) {
      // Already rendered with its error by the time `save` resolves.
      document.getElementById(SETTINGS_FIELD_ID[outcome.invalidField])?.focus()
      return
    }
    pendingFocus.current = outcome.invalidField
    goToTab(tab)
  }, [activeTab, goToTab, model])

  if (model.isLoadError) {
    return (
      <Page title={t('title')}>
        <Banner
          tone="critical"
          title={t('loadError')}
          action={{ content: t('retry'), onAction: model.retry }}
        />
      </Page>
    )
  }

  if (model.isPageLoading || !model.data || !model.values) {
    return <SettingsEmbeddedSkeleton title={t('title')} />
  }

  const data = model.data
  const readOnly = !model.canUpdateConfiguration
  const tabLabel = (tab: SettingsTabId) => t(`tabs.${tab}`)
  // Polaris renders tab labels as plain text (its `accessibilityLabel` is not
  // forwarded to the button), so the unsaved-changes dot is part of the name;
  // the App Bridge save bar announces the unsaved state itself.
  const tabs = SETTINGS_TABS.map((tab) => {
    const hasChanges = tab !== 'plan' && model.dirtyTabs.has(tab)
    return {
      id: `settings-tab-${tab}`,
      panelID: `settings-panel-${tab}`,
      content: hasChanges ? `${tabLabel(tab)} •` : tabLabel(tab),
    }
  })
  const firstDirtyTab = SETTINGS_TABS.find(
    (tab) => tab !== 'plan' && model.dirtyTabs.has(tab)
  )

  return (
    <Page title={t('title')}>
      <AppBridgeSaveBar
        id={SAVE_BAR_ID}
        open={model.isDirty && !readOnly && activeTab !== 'plan'}
        isSaving={model.isSaving}
        saveLabel={t('save')}
        discardLabel={t('discard')}
        onSave={() => void handleSave()}
        onDiscard={model.discard}
      />
      <BlockStack gap="400">
        <Tabs
          tabs={tabs}
          selected={SETTINGS_TABS.indexOf(activeTab)}
          onSelect={(index) => goToTab(SETTINGS_TABS[index])}
        >
          <BlockStack gap="400">
            {readOnly && (
              <Banner tone="info">
                <p>{t('readOnly')}</p>
              </Banner>
            )}
            {model.saveError && activeTab !== 'plan' && (
              <Banner tone="critical" onDismiss={model.dismissSaveError}>
                <p>{model.saveError}</p>
              </Banner>
            )}
            {activeTab === 'plan' && firstDirtyTab && (
              <Banner
                tone="warning"
                action={{
                  content: t('reviewChanges'),
                  onAction: () => goToTab(firstDirtyTab),
                }}
              >
                <p>{t('unsavedElsewhere')}</p>
              </Banner>
            )}

            {activeTab === 'message' && (
              <MessageTab model={model} data={data} readOnly={readOnly} />
            )}
            {activeTab === 'timing' && (
              <TimingTab model={model} data={data} readOnly={readOnly} />
            )}
            {activeTab === 'plan' && <PlanTab model={model} data={data} />}
          </BlockStack>
        </Tabs>
      </BlockStack>
    </Page>
  )
}
