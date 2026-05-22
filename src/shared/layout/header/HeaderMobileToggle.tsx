import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

interface HeaderMobileToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function HeaderMobileToggle({
  isOpen,
  onToggle,
}: HeaderMobileToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="rounded-xl p-2 transition-colors hover:bg-emerald-50 md:hidden"
      suppressHydrationWarning
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-6 w-6" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
