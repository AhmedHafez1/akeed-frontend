import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Globe } from 'lucide-react'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import type { AcquisitionTargets } from '@/features/marketing/domain/acquisitionPaths'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { headerOutlineControlClass } from './HeaderActions'
import type { HeaderNavItem } from './header.model'

interface HeaderMobileMenuProps {
  isOpen: boolean
  items: HeaderNavItem[]
  locale: string
  targets: AcquisitionTargets
  ctaLabel: string
  loginLabel: string
  loginHref: string
  onNavigate: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
  onLocaleChange: () => void
  onClose: () => void
}

const mobileLinkClass =
  'block w-full rounded-lg px-4 py-3 text-start text-base font-semibold text-slate-100 transition-colors hover:bg-white/8 hover:text-white'

export function HeaderMobileMenu({
  isOpen,
  items,
  locale,
  targets,
  ctaLabel,
  loginLabel,
  loginHref,
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
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-slate-950/96 backdrop-blur-xl lg:hidden"
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
                  {item.children ? (
                    <div className="pt-2">
                      <p className="px-4 pb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        {item.label}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          onClick={(event) => onNavigate(child.id, event)}
                          className={mobileLinkClass}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={(event) => onNavigate(item.id, event)}
                      className={mobileLinkClass}
                    >
                      {item.label}
                    </Link>
                  )}
                </motion.div>
              ))}
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={onLocaleChange}
                  className={`${headerOutlineControlClass} w-full px-4 py-3 text-base`}
                >
                  <Globe className="h-5 w-5" />
                  {locale === 'ar' ? 'English' : 'عربي'}
                </button>
                <Link
                  href={loginHref}
                  onClick={onClose}
                  className={`${headerOutlineControlClass} w-full px-4 py-3 text-base`}
                >
                  {loginLabel}
                </Link>
                <AcquisitionCta
                  target={targets.standalone}
                  label={ctaLabel}
                  variant="compact"
                  className="w-full px-4 py-3 text-base"
                  onNavigate={onClose}
                  trailing={<ArrowRight className="h-4 w-4 rtl:-scale-x-100" />}
                />
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
