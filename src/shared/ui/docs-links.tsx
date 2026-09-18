'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ExternalLink, LifeBuoy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { buildDocsArticleHref } from '@/shared/lib/docs-links'
import type { DocsArticleKey } from '@/shared/lib/docs-links'
import { cn } from '@/shared/lib/utils'

interface DocsLinkProps {
  article: DocsArticleKey
  hash?: string
  className?: string
  children?: ReactNode
}

export function DocsLink({
  article,
  hash,
  className,
  children,
}: DocsLinkProps) {
  const t = useTranslations('docsHelp')
  const { locale } = useLocaleInfo()
  const { isEmbedded } = useAkeedMode()
  const href = buildDocsArticleHref({ locale, article, hash })

  return (
    <Link
      href={href}
      target={isEmbedded ? '_blank' : undefined}
      rel={isEmbedded ? 'noreferrer' : undefined}
      className={className}
    >
      {children ?? t('viewDocumentation')}
    </Link>
  )
}

export function HelpButton({
  article,
  hash,
  className,
}: Omit<DocsLinkProps, 'children'>) {
  const t = useTranslations('docsHelp')

  return (
    <DocsLink
      article={article}
      hash={hash}
      className={cn(
        'border-input bg-muted text-foreground hover:border-input hover:bg-accent inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors',
        className
      )}
    >
      <LifeBuoy className="h-3.5 w-3.5" />
      <span>{t('viewDocumentation')}</span>
      <ExternalLink className="h-3 w-3" />
    </DocsLink>
  )
}

export function LearnMoreLink({
  article,
  hash,
  className,
}: Omit<DocsLinkProps, 'children'>) {
  const t = useTranslations('docsHelp')

  return (
    <DocsLink
      article={article}
      hash={hash}
      className={cn(
        'text-primary hover:text-primary-hover inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2',
        className
      )}
    >
      <span>{t('learnMore')}</span>
      <ExternalLink className="h-3.5 w-3.5" />
    </DocsLink>
  )
}

export function ContextualDocsLink({
  article,
  hash,
  className,
}: Omit<DocsLinkProps, 'children'>) {
  const t = useTranslations('docsHelp')

  return (
    <DocsLink
      article={article}
      hash={hash}
      className={cn(
        'text-primary hover:text-primary-hover inline-flex items-center gap-1 text-xs font-medium',
        className
      )}
    >
      <span>{t('needHelp')}</span>
      <ExternalLink className="h-3 w-3" />
    </DocsLink>
  )
}
