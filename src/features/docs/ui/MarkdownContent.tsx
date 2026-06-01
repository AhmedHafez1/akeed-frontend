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
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
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
        <h1 id={id} className="group mt-8 mb-4 scroll-mt-28 text-3xl font-bold text-slate-900 first:mt-0">
          <a href={`#${id}`} className="inline-flex items-center gap-2 hover:text-emerald-700">
            {children}
            <span className="text-sm text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h1>
      )
    },
    h2: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h2 id={id} className="group mt-8 mb-3 scroll-mt-28 border-t border-slate-100 pt-6 text-2xl font-bold text-slate-900 first:border-t-0 first:pt-0">
          <a href={`#${id}`} className="inline-flex items-center gap-2 hover:text-emerald-700">
            {children}
            <span className="text-sm text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h2>
      )
    },
    h3: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h3 id={id} className="group mt-6 mb-2 scroll-mt-28 text-xl font-semibold text-slate-900">
          <a href={`#${id}`} className="inline-flex items-center gap-2 hover:text-emerald-700">
            {children}
            <span className="text-sm text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h3>
      )
    },
    h4: ({ children }) => {
      const id = nextHeadingId(extractText(children))

      return (
        <h4 id={id} className="group mt-5 mb-2 scroll-mt-28 text-lg font-semibold text-slate-900">
          <a href={`#${id}`} className="inline-flex items-center gap-2 hover:text-emerald-700">
            {children}
            <span className="text-sm text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
              #
            </span>
          </a>
        </h4>
      )
    },
    p: ({ children }) => (
      <p className="my-3 text-sm leading-7 text-slate-700 md:text-base">{children}</p>
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
    li: ({ children }) => <li className="marker:text-emerald-600">{children}</li>,
    hr: () => <hr className="my-8 border-slate-200" />,
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
        <blockquote className="my-4 rounded-r-xl border-s-4 border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm leading-7 text-slate-700 md:text-base">
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
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            {children}
          </a>
        )
      }

      if (resolvedHref.startsWith('#')) {
        return (
          <a
            href={resolvedHref}
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            {children}
          </a>
        )
      }

      return (
        <Link
          href={resolvedHref}
          className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
        >
          {children}
        </Link>
      )
    },
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-slate-100 last:border-b-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-start text-xs font-semibold tracking-wide text-slate-700 uppercase">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 align-top text-sm text-slate-700">{children}</td>
    ),
    pre: ({ children }) => (
      <pre className="my-5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {children}
      </pre>
    ),
    code: ({ children, className }) => {
      const isInlineCode = !className

      if (isInlineCode) {
        return (
          <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-[0.92em] font-medium text-emerald-800">
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
          className="my-6 w-full rounded-xl border border-slate-200 bg-white object-contain"
        />
      )
    },
  }

  return (
    <div className="docs-markdown text-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
