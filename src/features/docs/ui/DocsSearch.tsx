'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/i18n'
import { searchDocs } from '@/features/docs/lib/docs-search'
import type {
  DocSearchEntry,
  DocSearchResult,
} from '@/features/docs/model/docs-search.model'

interface DocsSearchProps {
  locale: Locale
  entries: DocSearchEntry[]
}

function getOptionId(index: number): string {
  return `docs-search-option-${index}`
}

export function DocsSearch({ locale, entries }: DocsSearchProps) {
  const t = useTranslations('docs')
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [hasFocus, setHasFocus] = useState(false)

  const results = useMemo<DocSearchResult[]>(() => {
    return searchDocs(entries, query, locale)
  }, [entries, locale, query])

  useEffect(() => {
    function onWindowKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isEditableTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (event.key === '/' && !isEditableTarget) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onWindowKeyDown)
    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
    }
  }, [])

  const isOpen = hasFocus && Boolean(query.trim())
  const safeActiveIndex =
    results.length === 0
      ? -1
      : Math.max(0, Math.min(activeIndex, results.length - 1))

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()

      if (!results.length) return

      setActiveIndex((previous) => {
        if (previous < 0) return 0
        return Math.min(previous + 1, results.length - 1)
      })
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      if (!results.length) return

      setActiveIndex((previous) => {
        if (previous <= 0) return 0
        return previous - 1
      })
      return
    }

    if (event.key === 'Enter') {
      if (!isOpen || safeActiveIndex < 0 || safeActiveIndex >= results.length) {
        return
      }

      event.preventDefault()
      const selected = results[safeActiveIndex]
      window.location.assign(selected.item.href)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()

      if (query) {
        setQuery('')
      }

      setActiveIndex(-1)
    }
  }

  function clearSearch() {
    setQuery('')
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const activeDescendant =
    safeActiveIndex >= 0 && safeActiveIndex < results.length
      ? getOptionId(safeActiveIndex)
      : undefined

  return (
    <div className="relative">
      <label htmlFor="docs-search-input" className="sr-only">
        {t('searchLabel')}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="docs-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value
            setQuery(nextValue)
            setActiveIndex(nextValue.trim() ? 0 : -1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setHasFocus(true)}
          onBlur={() => {
            window.setTimeout(() => setHasFocus(false), 120)
          }}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="docs-search-results"
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          placeholder={t('searchPlaceholder')}
          className="h-11 w-full rounded-xl border border-emerald-100 bg-white pr-10 pl-9 text-sm text-slate-700 shadow-sm transition-colors focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSearch}
            aria-label={t('clearSearch')}
            className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          id="docs-search-results"
          role="listbox"
          aria-label={t('searchResultsLabel')}
          className="absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-emerald-100 bg-white p-2 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-500">{t('searchNoResults')}</p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => {
                const isActive = index === safeActiveIndex

                return (
                  <li key={result.item.id}>
                    <Link
                      id={getOptionId(index)}
                      href={result.item.href}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`block rounded-lg px-3 py-2 transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-semibold">{result.item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{result.item.excerpt}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}

      <p className="mt-2 text-xs text-slate-500">{t('searchHint')}</p>
    </div>
  )
}
