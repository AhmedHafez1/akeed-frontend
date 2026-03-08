import { AnimatePresence, motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { HeaderNavItem } from './header.model'

interface HeaderMobileMenuProps {
  isOpen: boolean
  items: HeaderNavItem[]
  locale: string
  ctaLabel: string
  onNavigate: (id: string) => void
  onLocaleChange: () => void
  onCtaClick: () => void
}

export function HeaderMobileMenu({
  isOpen,
  items,
  locale,
  ctaLabel,
  onNavigate,
  onLocaleChange,
  onCtaClick,
}: HeaderMobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="space-y-1 py-6">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onNavigate(item.id)}
                  className="block w-full rounded-lg px-4 py-3 text-left text-base font-semibold text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                >
                  {item.label}
                </motion.button>
              ))}
              <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                <button
                  onClick={onLocaleChange}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Globe className="h-5 w-5" />
                  {locale === 'ar' ? 'English' : 'عربي'}
                </button>
                <button
                  onClick={onCtaClick}
                  className="w-full rounded-lg bg-linear-to-r from-orange-600 to-orange-500 px-4 py-3 text-base font-bold text-white shadow-lg"
                >
                  {ctaLabel}
                </button>
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
