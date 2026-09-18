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
        <Search className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
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
          className="border-border bg-card text-foreground/80 focus:border-primary-border focus:ring-ring/20 h-11 w-full rounded-xl border pr-10 pl-9 text-sm shadow-sm transition-colors focus:ring-2 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSearch}
            aria-label={t('clearSearch')}
            className="text-muted-foreground hover:bg-muted hover:text-foreground/80 absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md"
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
          className="border-border bg-card absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border p-2 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-sm">
              {t('searchNoResults')}
            </p>
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
                          ? 'bg-accent text-foreground'
                          : 'text-foreground/80 hover:bg-muted/50'
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {result.item.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {result.item.excerpt}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}

      <p className="text-muted-foreground mt-2 text-xs">{t('searchHint')}</p>
    </div>
  )
}
