'use client'

import type { KeyboardEvent } from 'react'
import {
  STANDALONE_SETTINGS_TABS,
  type StandaloneSettingsTabId,
} from '@/features/settings/domain/settingsTabs'
import { cn } from '@/shared/lib/utils'

export const settingsTabDomId = (tab: StandaloneSettingsTabId) =>
  `settings-tab-${tab}`
export const settingsPanelDomId = (tab: StandaloneSettingsTabId) =>
  `settings-panel-${tab}`

interface SettingsTabsProps {
  label: string
  active: StandaloneSettingsTabId
  labels: Record<StandaloneSettingsTabId, string>
  /** Tabs holding unsaved changes; each gets a dot and a spoken note. */
  dirtyTabs: ReadonlySet<StandaloneSettingsTabId>
  unsavedLabel: string
  onSelect: (tab: StandaloneSettingsTabId) => void
}

/**
 * The page's underline tabs. Real tab semantics with roving focus; the arrow
 * keys follow the reading direction. The strip scrolls sideways on a narrow
 * phone rather than wrapping.
 */
export function SettingsTabs({
  label,
  active,
  labels,
  dirtyTabs,
  unsavedLabel,
  onSelect,
}: SettingsTabsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = STANDALONE_SETTINGS_TABS.length
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    )
    // From the focused tab, not the selected one: the selection follows the
    // URL, which can still be catching up with the previous key press.
    const focused = tabs.indexOf(document.activeElement as HTMLButtonElement)
    const index =
      focused >= 0 ? focused : STANDALONE_SETTINGS_TABS.indexOf(active)
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const targets: Record<string, number> = {
      [rtl ? 'ArrowLeft' : 'ArrowRight']: (index + 1) % count,
      [rtl ? 'ArrowRight' : 'ArrowLeft']: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    }
    const next = targets[event.key]
    if (next === undefined) return
    event.preventDefault()
    onSelect(STANDALONE_SETTINGS_TABS[next])
    tabs[next]?.focus()
  }

  return (
    <div className="relative">
      {/* The hairline the selected tab's underline sits on. */}
      <span
        aria-hidden="true"
        className="bg-line absolute inset-x-0 bottom-0 h-px"
      />
      {/* The padding gives the focus ring room inside the scroll box. */}
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="-m-1 flex gap-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STANDALONE_SETTINGS_TABS.map((tab) => {
          const selected = tab === active
          return (
            <button
              key={tab}
              id={settingsTabDomId(tab)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={settingsPanelDomId(tab)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(tab)}
              className={cn(
                'ak-focus text-ak-body rounded-t-ak-control relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 px-3.5 font-semibold whitespace-nowrap motion-safe:transition-colors motion-safe:duration-150',
                selected
                  ? 'text-ink after:bg-brand after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              {labels[tab]}
              {dirtyTabs.has(tab) && (
                <>
                  <span
                    aria-hidden="true"
                    className="bg-ak-warning size-1.5 rounded-full"
                  />
                  <span className="sr-only">{unsavedLabel}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
