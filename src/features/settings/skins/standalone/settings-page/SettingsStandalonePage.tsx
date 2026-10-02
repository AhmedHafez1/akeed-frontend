'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Lock, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  SETTINGS_FIELD_ID,
  SETTINGS_FIELD_TAB,
  type SettingsFieldKey,
} from '@/features/settings/domain/settingsForm'
import {
  isCanonicalStandaloneSettingsUrl,
  resolveStandaloneSettingsTab,
  STANDALONE_SETTINGS_TABS,
  type StandaloneSettingsTabId,
} from '@/features/settings/domain/settingsTabs'
import { useStandaloneSettings } from '@/features/settings/domain/useStandaloneSettings'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard } from '@/shared/ui'
import { ApiKeysTab } from './ApiKeysTab'
import { MessageTab } from './MessageTab'
import { SettingsSaveBar, settingsSaveBarClearance } from './SettingsSaveBar'
import { SettingsStandaloneSkeleton } from './SettingsStandaloneSkeleton'
import { StoreTab } from './StoreTab'
import {
  settingsPanelDomId,
  settingsTabDomId,
  SettingsTabs,
} from './SettingsTabs'
import { TimingTab } from './TimingTab'

function PageShell({
  title,
  subtitle,
  hasSaveBar = false,
  children,
}: {
  title: string
  subtitle: string
  /** Leaves room under the last card for the fixed save bar. */
  hasSaveBar?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-295 space-y-6 pt-2',
        hasSaveBar ? settingsSaveBarClearance : 'pb-8'
      )}
    >
      <header className="space-y-1">
        <h1 className="text-ak-title text-ink">{title}</h1>
        <p className="text-ak-body text-ink-muted">{subtitle}</p>
      </header>
      {children}
    </div>
  )
}

/**
 * The standalone Settings page: the header, the Message / Timing / Store / API keys tabs
 * driven by `?tab=`, and one save bar for the whole form. Edits survive a tab
 * switch; a tab holding unsaved changes is marked.
 */
export function SettingsStandalonePage() {
  const t = useTranslations('settings.standalone.page')
  const tMessages = useTranslations('settings.standalone.messages')
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const { locale } = useLocaleInfo()
  const model = useStandaloneSettings()
  // The field to focus once its tab has rendered after a failed save.
  const pendingFocus = useRef<SettingsFieldKey | null>(null)

  const urlParams = {
    tab: searchParams.get('tab'),
    section: searchParams.get('section'),
  }
  const destination = resolveStandaloneSettingsTab(urlParams)
  const isBilling = destination.kind === 'billing'
  const activeTab = destination.kind === 'tab' ? destination.tab : 'message'
  const isCanonicalUrl = isCanonicalStandaloneSettingsUrl(urlParams)

  const goToTab = useCallback(
    (tab: StandaloneSettingsTabId, mode: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('section')
      params.set('tab', tab)
      const href = `${pathname}?${params.toString()}`
      if (mode === 'replace') router.replace(href, { scroll: false })
      else router.push(href, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Standalone billing is a page of its own; older tab and `?section=` ids
  // land on the tab that now holds their fields, without a history entry.
  useEffect(() => {
    if (isBilling) router.replace(withLocale('/billing', locale))
    else if (!isCanonicalUrl) goToTab(activeTab, 'replace')
  }, [activeTab, goToTab, isBilling, isCanonicalUrl, locale, router])

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
      <PageShell title={t('title')} subtitle={t('subtitle')}>
        <div
          role="alert"
          className={cn(
            akCard,
            'mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-10 text-center'
          )}
        >
          <span className="bg-ak-danger-soft text-ak-danger flex size-10 items-center justify-center rounded-full">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-ak-section text-ink">{t('loadError.title')}</p>
            <p className="text-ak-body text-ink-muted">{t('loadError.body')}</p>
          </div>
          <button
            type="button"
            onClick={model.retry}
            className={akButton({ variant: 'secondary' })}
          >
            {t('loadError.retry')}
          </button>
        </div>
      </PageShell>
    )
  }

  if (isBilling || model.isPageLoading || !model.data || !model.values) {
    return <SettingsStandaloneSkeleton />
  }

  const data = model.data
  const readOnly = !model.canUpdateConfiguration
  const labels: Record<StandaloneSettingsTabId, string> = {
    message: t('tabs.message'),
    timing: t('tabs.timing'),
    store: t('tabs.store'),
    'api-keys': t('tabs.apiKeys'),
  }
  // The API keys tab holds no form fields, so it is never dirty.
  const dirtyTabs: ReadonlySet<StandaloneSettingsTabId> = model.dirtyTabs
  const dirtyTabLabels = STANDALONE_SETTINGS_TABS.filter((tab) =>
    dirtyTabs.has(tab)
  ).map((tab) => labels[tab])

  const showSaveBar = model.isDirty && !readOnly

  return (
    <PageShell
      title={t('title')}
      subtitle={t('subtitle')}
      hasSaveBar={showSaveBar}
    >
      <SettingsTabs
        label={t('title')}
        active={activeTab}
        labels={labels}
        dirtyTabs={model.dirtyTabs}
        unsavedLabel={t('unsavedShort')}
        onSelect={goToTab}
      />

      {readOnly && (
        <div
          role="status"
          className="border-ak-info/30 bg-ak-info-soft text-ak-info text-ak-body rounded-ak-card flex items-start gap-3 border px-4 py-3"
        >
          <Lock aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
          <p>{tMessages('readOnly')}</p>
        </div>
      )}
      {model.saveError && (
        <div
          role="alert"
          className="border-ak-danger/30 bg-ak-danger-soft text-ak-danger text-ak-body rounded-ak-card flex items-start gap-3 border px-4 py-3"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4.5 shrink-0"
          />
          <p className="min-w-0 flex-1 font-semibold">{model.saveError}</p>
          <button
            type="button"
            onClick={model.dismissSaveError}
            aria-label={t('dismiss')}
            className="ak-focus -my-0.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-70 hover:opacity-100"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}

      <div
        id={settingsPanelDomId(activeTab)}
        role="tabpanel"
        aria-labelledby={settingsTabDomId(activeTab)}
      >
        {activeTab === 'message' && (
          <MessageTab model={model} data={data} readOnly={readOnly} />
        )}
        {activeTab === 'timing' && (
          <TimingTab model={model} data={data} readOnly={readOnly} />
        )}
        {activeTab === 'store' && (
          <StoreTab model={model} data={data} readOnly={readOnly} />
        )}
        {activeTab === 'api-keys' && <ApiKeysTab readOnly={readOnly} />}
      </div>

      {showSaveBar && (
        <SettingsSaveBar
          label={t('saveBar.label')}
          message={
            dirtyTabLabels.length > 1
              ? t('saveBar.unsavedIn', {
                  tabs: dirtyTabLabels.join(t('saveBar.separator')),
                })
              : t('saveBar.unsaved')
          }
          discardLabel={t('saveBar.discard')}
          saveLabel={t('saveBar.save')}
          savingLabel={t('saveBar.saving')}
          isSaving={model.isSaving}
          onDiscard={model.discard}
          onSave={() => void handleSave()}
        />
      )}
    </PageShell>
  )
}
