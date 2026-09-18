/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Locale } from '@/i18n'
import {
  extractText,
  getLocalizedMarkdownHref,
  isExternalHttpLink,
  resolveMarkdownImageSource,
  slugifyHeading,
} from '@/features/docs/lib/markdown'

interface MarkdownContentProps {
  content: string
  locale: Locale
  currentSlug: string
}

type CalloutTone = 'info' | 'warning' | 'success'

const CALLOUT_STYLES: Record<CalloutTone, string> = {
  info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  success:
    'border-primary-border bg-primary-subtle text-primary-subtle-foreground',
}

function parseCalloutLabel(value: string): CalloutTone | null {
  const normalized = value.trim().toUpperCase()

  if (normalized === '[!INFO]') return 'info'
  if (normalized === '[!WARNING]') return 'warning'
  if (normalized === '[!SUCCESS]') return 'success'
  return null
}

function createHeadingIdFactory() {
  const counts = new Map<string, number>()

  return (rawText: string) => {
    const base = slugifyHeading(rawText) || 'section'
    const count = counts.get(base) ?? 0
    counts.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  }
}

export function MarkdownContent({
  content,
  locale,
  currentSlug,
}: MarkdownContentProps) {
  const nextHeadingId = createHeadingIdFactory()
  const markdownComponents: Components = {
    h1: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h1
          id={id}
          className="group text-foreground mt-8 mb-4 scroll-mt-28 text-3xl font-bold first:mt-0"
        >
          <a
            href={`#${id}`}
            className="hover:text-primary-hover inline-flex items-center gap-2"
          >
            {children}
            <span className="text-muted-foreground/70 text-sm opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h1>
      )
    },
    h2: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h2
          id={id}
          className="group border-border text-foreground mt-8 mb-3 scroll-mt-28 border-t pt-6 text-2xl font-bold first:border-t-0 first:pt-0"
        >
          <a
            href={`#${id}`}
            className="hover:text-primary-hover inline-flex items-center gap-2"
          >
            {children}
            <span className="text-muted-foreground/70 text-sm opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h2>
      )
    },
    h3: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h3
          id={id}
          className="group text-foreground mt-6 mb-2 scroll-mt-28 text-xl font-semibold"
        >
          <a
            href={`#${id}`}
            className="hover:text-primary-hover inline-flex items-center gap-2"
          >
            {children}
            <span className="text-muted-foreground/70 text-sm opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h3>
      )
    },
    h4: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h4
          id={id}
          className="group text-foreground mt-5 mb-2 scroll-mt-28 text-lg font-semibold"
        >
          <a
            href={`#${id}`}
            className="hover:text-primary-hover inline-flex items-center gap-2"
          >
            {children}
            <span className="text-muted-foreground/70 text-sm opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h4>
      )
    },
    p: ({ children }) => (
      <p className="text-foreground/80 my-3 text-sm leading-7 md:text-base">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="my-4 list-disc space-y-2 ps-6 text-sm leading-7 md:text-base">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 list-decimal space-y-2 ps-6 text-sm leading-7 md:text-base">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="marker:text-primary">{children}</li>,
    hr: () => <hr className="border-border my-8" />,
    blockquote: ({ children }) => {
      const nodes = Array.isArray(children) ? children : [children]
      const firstChild = nodes[0]
      const firstChildText = extractText(firstChild).trim()
      const calloutTone = parseCalloutLabel(firstChildText)

      if (calloutTone) {
        const rest = nodes.slice(1)

        return (
          <div
            className={`my-5 rounded-xl border px-4 py-3 text-sm leading-7 md:text-base ${CALLOUT_STYLES[calloutTone]}`}
          >
            {rest.length > 0 ? rest : null}
          </div>
        )
      }

      return (
        <blockquote className="border-input bg-muted/50 text-foreground/80 my-4 rounded-r-xl border-s-4 px-4 py-3 text-sm leading-7 md:text-base">
          {children}
        </blockquote>
      )
    },
    a: ({ href = '', children }) => {
      const resolvedHref = getLocalizedMarkdownHref(href, locale, currentSlug)
      const isExternal = isExternalHttpLink(resolvedHref)

      if (isExternal) {
        return (
          <a
            href={resolvedHref}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-primary-hover font-medium underline underline-offset-2"
          >
            {children}
          </a>
        )
      }

      if (resolvedHref.startsWith('#')) {
        return (
          <a
            href={resolvedHref}
            className="text-primary hover:text-primary-hover font-medium underline underline-offset-2"
          >
            {children}
          </a>
        )
      }

      return (
        <Link
          href={resolvedHref}
          className="text-primary hover:text-primary-hover font-medium underline underline-offset-2"
        >
          {children}
        </Link>
      )
    },
    table: ({ children }) => (
      <div className="border-border my-5 overflow-x-auto rounded-xl border">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-border border-b last:border-b-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="text-foreground/80 px-3 py-2 text-start text-xs font-semibold tracking-wide uppercase">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="text-foreground/80 px-3 py-2 align-top text-sm">
        {children}
      </td>
    ),
    pre: ({ children }) => (
      <pre className="border-border my-5 overflow-x-auto rounded-xl border bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {children}
      </pre>
    ),
    code: ({ children, className }) => {
      const isInlineCode = !className

      if (isInlineCode) {
        return (
          <code className="bg-muted text-foreground rounded px-1.5 py-0.5 text-[0.92em] font-medium">
            {children}
          </code>
        )
      }

      return <code className={className}>{children}</code>
    },
    img: ({ src = '', alt = '' }) => {
      if (typeof src !== 'string') {
        return null
      }

      const resolvedSrc = resolveMarkdownImageSource(src)

      return (
        <img
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          className="border-border bg-card my-6 w-full rounded-xl border object-contain"
        />
      )
    },
  }

  return (
    <div className="docs-markdown text-foreground/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
