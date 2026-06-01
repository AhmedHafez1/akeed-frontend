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
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const label = item.label === 'docs' ? t('docsCrumb') : item.label

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-slate-600 hover:text-emerald-700"
                >
                  {label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-slate-800' : ''}>
                  {label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
