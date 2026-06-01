import type { Locale } from '@/i18n'
import { withLocale } from '@/shared/lib/locale'

const HTTP_LINK_REGEX = /^https?:\/\//i
const SCHEME_LINK_REGEX = /^[a-z][a-z\d+.-]*:/i
const DOC_EXTENSION_REGEX = /\.(md|markdown)$/i

export function slugifyHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeDocPath(pathname: string): string {
  return pathname.replace(DOC_EXTENSION_REGEX, '')
}

export function getLocalizedMarkdownHref(
  href: string,
  locale: Locale,
  currentSlug?: string
): string {
  if (!href) {
    return withLocale('/docs', locale)
  }

  if (href.startsWith('#')) {
    return href
  }

  if (SCHEME_LINK_REGEX.test(href)) {
    return href
  }

  if (href.startsWith('/')) {
    return withLocale(normalizeDocPath(href), locale)
  }

  const basePath = withLocale(`/docs/${currentSlug ?? ''}/`, locale)
  const resolved = new URL(href, `https://docs.local${basePath}`)
  const normalizedPath = normalizeDocPath(resolved.pathname)

  return `${normalizedPath}${resolved.search}${resolved.hash}`
}

export function isExternalHttpLink(href: string): boolean {
  return HTTP_LINK_REGEX.test(href)
}

export function resolveMarkdownImageSource(src: string): string {
  if (!src) {
    return ''
  }

  if (SCHEME_LINK_REGEX.test(src) || src.startsWith('/')) {
    return src
  }

  return `/images/docs/${src.replace(/^\/+/, '')}`
}

export function extractText(value: unknown): string {
  if (value == null || typeof value === 'boolean') {
    return ''
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map(extractText).join('')
  }

  if (typeof value === 'object' && 'props' in value) {
    const props = value.props as { children?: unknown }
    return extractText(props.children)
  }

  return ''
}
