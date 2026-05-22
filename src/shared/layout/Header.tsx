'use client'

import { useHeader } from './header/useHeader'
import { HeaderActions } from './header/HeaderActions'
import { HeaderLogo } from './header/HeaderLogo'
import { HeaderMobileMenu } from './header/HeaderMobileMenu'
import { HeaderMobileToggle } from './header/HeaderMobileToggle'
import { HeaderNav } from './header/HeaderNav'

export function Header() {
  const {
    t,
    locale,
    homeHref,
    navigation,
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    scrollToSection,
    handleHomeClick,
    handleLocaleChange,
  } = useHeader()

  return (
    <>
        <header
          className={`fixed top-0 z-50 w-full transition-all duration-400 ${
            isScrolled
              ? 'border-b border-emerald-100/70 bg-white/85 shadow-sm backdrop-blur-md'
              : 'bg-white/60 backdrop-blur'
          }`}
        >
        <div className="px-4 sm:px-6 lg:px-8 xl:mx-46">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <HeaderLogo href={homeHref} onClick={handleHomeClick} />

            {/* Desktop Navigation */}
            <HeaderNav items={navigation} onNavigate={scrollToSection} />

            {/* CTA + Language */}
            <HeaderActions
              locale={locale}
              ctaLabel={t('cta')}
              onLocaleChange={handleLocaleChange}
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
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </header>
    </>
  )
}

export default Header
