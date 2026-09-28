'use client'

import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { CONFIRMATIONS_TABS } from '@/features/dashboard/domain/confirmationsUrlState'
import { formatCount } from '@/features/dashboard/lib/orderDisplay'
import type { ConfirmationsTab } from '@/features/dashboard/model/dashboard.model'

interface ConfirmationsToolbarProps {
  tab: ConfirmationsTab
  tabCounts: Record<ConfirmationsTab, number> | null
  onTabChange: (tab: ConfirmationsTab) => void
  /** The id of the list the tabs control. */
  panelId: string
  /** Id prefix for each tab, so the panel can name the selected one. */
  tabIdPrefix: string
  searchInput: string
  isSearchValid: boolean
  onSearchChange: (value: string) => void
  onSearchClear: () => void
}

/**
 * Outcome tabs in a sunken track: the selected one inverse, each with a count
 * bubble that disappears at zero. Real tab semantics with roving focus; the
 * arrow keys follow the reading direction.
 */
function ConfirmationTabs({
  tab,
  tabCounts,
  onTabChange,
  panelId,
  tabIdPrefix,
}: Pick<
  ConfirmationsToolbarProps,
  'tab' | 'tabCounts' | 'onTabChange' | 'panelId' | 'tabIdPrefix'
>) {
  const t = useTranslations('dashboard.confirmations')
  const { locale } = useLocaleInfo()
  const listRef = useRef<HTMLDivElement>(null)

  const select = (next: ConfirmationsTab) => {
    onTabChange(next)
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [CONFIRMATIONS_TABS.indexOf(next)]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = CONFIRMATIONS_TABS.length
    const index = CONFIRMATIONS_TABS.indexOf(tab)
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
    select(CONFIRMATIONS_TABS[next])
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t('tabsLabel')}
      onKeyDown={onKeyDown}
      className="border-line bg-surface-sunken rounded-ak-card inline-flex items-center gap-1 border p-1"
    >
      {CONFIRMATIONS_TABS.map((id) => {
        const selected = id === tab
        const count = tabCounts?.[id] ?? 0
        return (
          <button
            key={id}
            id={`${tabIdPrefix}-${id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTabChange(id)}
            className={cn(
              'ak-focus text-ak-body inline-flex h-9 items-center gap-2 rounded-lg px-3 font-semibold whitespace-nowrap transition-colors',
              selected
                ? 'bg-inverse text-inverse-foreground'
                : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
            )}
          >
            {t(`tabs.${id}`)}
            {count > 0 && (
              <span
                className={cn(
                  'text-ak-label inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 tabular-nums',
                  id === 'needs_action'
                    ? 'bg-ak-warning-soft text-ak-warning'
                    : selected
                      ? 'bg-inverse-foreground/15 text-inverse-foreground'
                      : 'bg-neutral-soft text-ink-muted'
                )}
              >
                <bdi>{formatCount(count, locale)}</bdi>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** True when a keystroke is going into a field rather than to the page. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}

/**
 * Tabs at the start, search by order number or phone at the end. `/`
 * anywhere on the page (outside a field) jumps to the search box. The tabs
 * scroll sideways on a phone rather than wrapping.
 */
export function ConfirmationsToolbar({
  tab,
  tabCounts,
  onTabChange,
  panelId,
  tabIdPrefix,
  searchInput,
  isSearchValid,
  onSearchChange,
  onSearchClear,
}: ConfirmationsToolbarProps) {
  const t = useTranslations('dashboard.confirmations')
  const tTable = useTranslations('dashboard.standalone.table')
  const errorId = useId()
  const hintId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey)
        return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="border-line flex flex-col gap-3 border-b px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="-mx-4 min-w-0 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <ConfirmationTabs
          tab={tab}
          tabCounts={tabCounts}
          onTabChange={onTabChange}
          panelId={panelId}
          tabIdPrefix={tabIdPrefix}
        />
      </div>

      <div className="w-full lg:w-80 lg:shrink-0">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-ink-muted pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2"
          />
          <input
            ref={inputRef}
            type="search"
            inputMode="tel"
            autoComplete="off"
            maxLength={32}
            aria-label={t('search.label')}
            aria-invalid={!isSearchValid || undefined}
            aria-describedby={isSearchValid ? hintId : `${hintId} ${errorId}`}
            aria-keyshortcuts="/"
            placeholder={tTable('searchPlaceholder')}
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            className={cn(
              'ak-focus bg-surface-raised text-ink text-ak-body placeholder:text-ink-muted rounded-ak-control h-11 w-full border ps-10 pe-11 [&::-webkit-search-cancel-button]:hidden',
              isSearchValid ? 'border-control-border' : 'border-ak-danger'
            )}
          />
          <span id={hintId} className="sr-only">
            {tTable('searchShortcut')}
          </span>
          {searchInput ? (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label={t('search.clear')}
              className="ak-focus text-ink-muted hover:text-ink absolute end-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="border-line-strong bg-surface-sunken text-ink-muted text-ak-label pointer-events-none absolute end-3 top-1/2 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-md border px-1.5 font-sans sm:inline-flex"
            >
              /
            </kbd>
          )}
        </div>
        {!isSearchValid && (
          <p
            id={errorId}
            role="alert"
            className="text-ak-caption text-ak-danger mt-1.5"
          >
            {t('search.invalid')}
          </p>
        )}
      </div>
    </div>
  )
}
