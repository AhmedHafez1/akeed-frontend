import type {
  DocSearchEntry,
  DocSearchResult,
} from '@/features/docs/model/docs-search.model'

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

function scoreResult(
  query: string,
  entry: DocSearchEntry,
  locale: DocSearchEntry['locale']
): number {
  const normalizedQuery = normalizeSearchText(query)
  const title = normalizeSearchText(entry.title)
  const description = normalizeSearchText(entry.description ?? '')
  const content = normalizeSearchText(entry.contentText)

  if (!normalizedQuery) {
    return 0
  }

  let score = 0

  if (entry.locale === locale) {
    score += 100
  }

  if (title === normalizedQuery) {
    score += 120
  } else if (title.startsWith(normalizedQuery)) {
    score += 90
  } else if (title.includes(normalizedQuery)) {
    score += 70
  }

  if (description.includes(normalizedQuery)) {
    score += 30
  }

  const contentIndex = content.indexOf(normalizedQuery)
  if (contentIndex >= 0) {
    score += 20
    score += Math.max(0, 10 - Math.floor(contentIndex / 250))
  }

  return score
}

export function searchDocs(
  entries: DocSearchEntry[],
  query: string,
  locale: DocSearchEntry['locale'],
  limit = 8
): DocSearchResult[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const results = entries
    .map((entry) => ({
      item: entry,
      score: scoreResult(normalizedQuery, entry, locale),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}
