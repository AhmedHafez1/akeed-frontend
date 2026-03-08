'use client'

import dynamic from 'next/dynamic'
import { useHeader } from './header/useHeader'
import { HeaderActions } from './header/HeaderActions'
import { HeaderLogo } from './header/HeaderLogo'
import { HeaderMobileMenu } from './header/HeaderMobileMenu'
import { HeaderMobileToggle } from './header/HeaderMobileToggle'
import { HeaderNav } from './header/HeaderNav'

const ReservationModal = dynamic(
  () =>
    import('@/features/marketing/ui/sections/ReservationModal').then((mod) => mod.ReservationModal),
  { ssr: false }
)

export function Header() {
  const {
    t,
    locale,
    navigation,
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    scrollToSection,
    handleLocaleChange,
  } = useHeader()

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-400 ${
          isScrolled
            ? 'border-b border-orange-100/70 bg-white/85 shadow-sm backdrop-blur-md'
            : 'bg-white/60 backdrop-blur'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 xl:mx-46">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <HeaderLogo
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />

            {/* Desktop Navigation */}
            <HeaderNav items={navigation} onNavigate={scrollToSection} />

            {/* CTA + Language */}
            <HeaderActions
              locale={locale}
              ctaLabel={t('cta')}
              onLocaleChange={handleLocaleChange}
              onCtaClick={() => setIsReservationModalOpen(true)}
            />

            {/* Mobile Menu Button */}
            <HeaderMobileToggle
              isOpen={isMobileMenuOpen}
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <HeaderMobileMenu
          isOpen={isMobileMenuOpen}
          items={navigation}
          locale={locale}
          ctaLabel={t('cta')}
          onNavigate={scrollToSection}
          onLocaleChange={handleLocaleChange}
          onCtaClick={() => {
            setIsMobileMenuOpen(false)
            setIsReservationModalOpen(true)
          }}
        />
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => setIsReservationModalOpen(false)}
        />
      </header>
    </>
  )
}

export default Header
