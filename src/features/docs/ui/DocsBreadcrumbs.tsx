import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface DocsBreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function DocsBreadcrumbs({ items }: DocsBreadcrumbsProps) {
  const t = useTranslations('docs')

  return (
    <nav aria-label={t('breadcrumbsLabel')}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const label = item.label === 'docs' ? t('docsCrumb') : item.label

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-primary-hover text-foreground/70 font-medium"
                >
                  {label}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground font-semibold' : ''}>
                  {label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="text-muted-foreground/70 h-3.5 w-3.5" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
