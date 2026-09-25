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
    loginHref,
    dashboardHref,
    isAuthenticated,
    navigation,
    acquisitionTargets,
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
        className={`fixed top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          isScrolled
            ? 'shadow-overlay border-white/10 bg-slate-950/95 backdrop-blur-md'
            : 'border-transparent bg-slate-950'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex h-16 items-center justify-between gap-6 lg:h-17">
            {/* Logo */}
            <HeaderLogo href={homeHref} onClick={handleHomeClick} />

            {/* Desktop Navigation */}
            <HeaderNav items={navigation} onNavigate={scrollToSection} />

            {/* Language + Login + CTA */}
            <HeaderActions
              locale={locale}
              targets={acquisitionTargets}
              ctaLabel={t('cta_primary')}
              loginLabel={t('login')}
              loginHref={loginHref}
              dashboardLabel={t('dashboard')}
              dashboardHref={dashboardHref}
              isAuthenticated={isAuthenticated}
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
          targets={acquisitionTargets}
          ctaLabel={t('cta_primary')}
          loginLabel={t('login')}
          loginHref={loginHref}
          dashboardLabel={t('dashboard')}
          dashboardHref={dashboardHref}
          isAuthenticated={isAuthenticated}
          onNavigate={scrollToSection}
          onLocaleChange={handleLocaleChange}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </header>
    </>
  )
}

export default Header
