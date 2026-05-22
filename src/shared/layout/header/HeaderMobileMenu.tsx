import { AnimatePresence, motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import type { HeaderNavItem } from './header.model'

interface HeaderMobileMenuProps {
  isOpen: boolean
  items: HeaderNavItem[]
  locale: string
  ctaLabel: string
  onNavigate: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
  onLocaleChange: () => void
  onClose: () => void
}

export function HeaderMobileMenu({
  isOpen,
  items,
  locale,
  ctaLabel,
  onNavigate,
  onLocaleChange,
  onClose,
}: HeaderMobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border-t border-white/10 bg-slate-950/96 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="space-y-1 py-6">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={(event) => onNavigate(item.id, event)}
                    className="block w-full rounded-lg px-4 py-3 text-start text-base font-semibold text-slate-100 transition-colors hover:bg-white/8 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <button
                  onClick={onLocaleChange}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 px-4 py-3 text-base font-semibold text-slate-100 ring-1 ring-white/10 transition-colors hover:bg-white/12 hover:text-white"
                >
                  <Globe className="h-5 w-5" />
                  {locale === 'ar' ? 'English' : 'عربي'}
                </button>
                <a
                  href={SHOPIFY_APP_STORE_LISTING_URL}
                  onClick={onClose}
                  className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-base font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.28)] transition-colors hover:bg-emerald-500"
                >
                  {ctaLabel}
                </a>
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
