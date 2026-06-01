import type { Locale } from '@/i18n'
import { getDocList } from '@/features/docs/lib/docs'
import type { DocNavItem, DocPagerItem } from '@/features/docs/model/docs.model'

function toDocHref(locale: Locale, slug: string): string {
  return `/${locale}/docs/${slug}`
}

function toDocsRootHref(locale: Locale): string {
  return `/${locale}/docs`
}

export async function getDocsNavItems(locale: Locale): Promise<DocNavItem[]> {
  const docs = await getDocList(locale)

  return docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    href: toDocHref(locale, doc.slug),
    order: doc.order,
  }))
}

export async function getDocPager(
  locale: Locale,
  slug: string
): Promise<{ previous: DocPagerItem | null; next: DocPagerItem | null }> {
  const navItems = await getDocsNavItems(locale)
  const index = navItems.findIndex((item) => item.slug === slug)

  if (index === -1) {
    return { previous: null, next: null }
  }

  const previousItem = index > 0 ? navItems[index - 1] : null
  const nextItem = index < navItems.length - 1 ? navItems[index + 1] : null

  return {
    previous: previousItem
      ? {
          slug: previousItem.slug,
          title: previousItem.title,
          href: previousItem.href,
        }
      : null,
    next: nextItem
      ? {
          slug: nextItem.slug,
          title: nextItem.title,
          href: nextItem.href,
        }
      : null,
  }
}

export function getDocsBreadcrumbs(locale: Locale, title?: string) {
  const docsRoot = {
    label: 'docs',
    href: toDocsRootHref(locale),
  }

  if (!title) {
    return [docsRoot]
  }

  return [docsRoot, { label: title }]
}
