import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { HeaderNavItem } from './header.model'

interface HeaderNavProps {
  items: HeaderNavItem[]
  onNavigate: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
}

const navLinkClass =
  'focus-visible:ring-primary-border inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-slate-200/85 transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none data-[state=open]:text-white'

export function HeaderNav({ items, onNavigate }: HeaderNavProps) {
  return (
    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          {item.children ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className={`group ${navLinkClass}`}>
                {item.label}
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-48">
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.id} asChild>
                    <Link
                      href={child.href}
                      onClick={(event) => onNavigate(child.id, event)}
                      className="cursor-pointer font-medium"
                    >
                      {child.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={item.href}
              onClick={(event) => onNavigate(item.id, event)}
              className={navLinkClass}
            >
              {item.label}
            </Link>
          )}
        </motion.div>
      ))}
    </nav>
  )
}
