'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { cn } from '@/shared/lib/utils'
import { SegmentedControl } from '@/shared/ui'
import { CONFIRMATIONS_TABS } from '@/features/dashboard/domain/confirmationsUrlState'
import type { ConfirmationsTab } from '@/features/dashboard/model/dashboard.model'

interface ConfirmationsToolbarProps {
  tab: ConfirmationsTab
  tabCounts: Record<ConfirmationsTab, number> | null
  onTabChange: (tab: ConfirmationsTab) => void
  searchInput: string
  isSearchValid: boolean
  onSearchChange: (value: string) => void
  onSearchClear: () => void
}

/**
 * Outcome filter with per-outcome counts at the start, search by order number
 * or phone at the end. The filter scrolls sideways on a phone rather than
 * wrapping into a second row of pills.
 */
export function ConfirmationsToolbar({
  tab,
  tabCounts,
  onTabChange,
  searchInput,
  isSearchValid,
  onSearchChange,
  onSearchClear,
}: ConfirmationsToolbarProps) {
  const t = useTranslations('dashboard.confirmations')
  const errorId = useId()

  return (
    <div className="border-border flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="-mx-3 min-w-0 overflow-x-auto px-3 lg:mx-0 lg:px-0">
        <SegmentedControl<ConfirmationsTab>
          aria-label={t('tabsLabel')}
          value={tab}
          onChange={onTabChange}
          className="whitespace-nowrap"
          options={CONFIRMATIONS_TABS.map((id) => ({
            value: id,
            label: t(`tabs.${id}`),
            count: tabCounts?.[id],
          }))}
        />
      </div>

      <div className="w-full lg:w-80">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
          />
          <input
            type="search"
            inputMode="tel"
            autoComplete="off"
            maxLength={32}
            aria-label={t('search.label')}
            aria-invalid={!isSearchValid || undefined}
            aria-describedby={isSearchValid ? undefined : errorId}
            placeholder={t('search.placeholder')}
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            className={cn(
              'bg-background text-foreground placeholder:text-muted-foreground rounded-control h-10 w-full border ps-9 pe-9 text-sm transition focus:ring-2 focus:outline-none [&::-webkit-search-cancel-button]:hidden',
              isSearchValid
                ? 'border-input focus:border-primary focus:ring-primary-border'
                : 'border-destructive-border focus:ring-destructive-border'
            )}
          />
          {searchInput && (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label={t('search.clear')}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
        {!isSearchValid && (
          <p
            id={errorId}
            role="alert"
            className="text-destructive-subtle-foreground mt-1.5 text-xs"
          >
            {t('search.invalid')}
          </p>
        )}
      </div>
    </div>
  )
}
