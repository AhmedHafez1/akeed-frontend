import { motion } from 'framer-motion'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import { HeaderNavItem } from './header.model'

interface HeaderNavProps {
  items: HeaderNavItem[]
  onNavigate: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
}

export function HeaderNav({ items, onNavigate }: HeaderNavProps) {
  return (
    <nav className="hidden items-center gap-2 md:flex">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={item.href}
            onClick={(event) => onNavigate(item.id, event)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
          >
            {item.label}
          </Link>
        </motion.div>
      ))}
    </nav>
  )
}
