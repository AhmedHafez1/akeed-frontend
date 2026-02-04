import { motion } from 'framer-motion'
import { HeaderNavItem } from '@/types/header.model'

interface HeaderNavProps {
  items: HeaderNavItem[]
  onNavigate: (id: string) => void
}

export function HeaderNav({ items, onNavigate }: HeaderNavProps) {
  return (
    <nav className="hidden items-center gap-2 md:flex">
      {items.map((item, index) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onNavigate(item.id)}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-700"
        >
          {item.label}
        </motion.button>
      ))}
    </nav>
  )
}
