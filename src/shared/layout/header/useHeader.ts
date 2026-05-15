import { type MouseEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { openShopifyAppStore } from '@/shared/lib/shopify-auth'
import { HeaderNavItem } from './header.model'

const SCROLL_THRESHOLD = 20
const SCROLL_OFFSET = 80
const MOBILE_SCROLL_DELAY = 100

function getPathWithoutLocale(pathname: string): string {
  return '/' + pathname.split('/').slice(2).join('/')
}

function scrollToElement(id: string): boolean {
  const element = document.getElementById(id)

  if (!element) return false

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.scrollY - SCROLL_OFFSET
  window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  return true
}

export function useHeader() {
  const t = useTranslations('header')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const homeHref = withLocale('/', locale)
  const isHomePage = getPathWithoutLocale(pathname) === '/'

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = useMemo<HeaderNavItem[]>(
    () => [
      {
        href: withLocale('/#solution', locale),
        label: t('features'),
        id: 'solution',
      },
      {
        href: withLocale('/#pricing', locale),
        label: t('pricing'),
        id: 'pricing',
      },
      { href: withLocale('/#faq', locale), label: t('faq'), id: 'faq' },
    ],
    [locale, t]
  )

  useEffect(() => {
    if (!isHomePage) return

    const id = window.location.hash.replace('#', '')
    if (!id) return

    const timeoutId = window.setTimeout(() => {
      scrollToElement(id)
    }, MOBILE_SCROLL_DELAY)

    return () => window.clearTimeout(timeoutId)
  }, [isHomePage, pathname])

  const scrollToSection = (
    id: string,
    event?: MouseEvent<HTMLAnchorElement>
  ) => {
    setIsMobileMenuOpen(false)

    if (!isHomePage) return

    event?.preventDefault()

    setTimeout(() => {
      if (scrollToElement(id)) {
        window.history.pushState(null, '', withLocale(`/#${id}`, locale))
      }
    }, MOBILE_SCROLL_DELAY)
  }

  const handleHomeClick = (event?: MouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false)

    if (!isHomePage) return
    event?.preventDefault()

    window.history.pushState(null, '', homeHref)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLocaleChange = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const segments = pathname.split('/')

    if (segments.length > 1) {
      segments[1] = newLocale
      const newPath = segments.join('/') || '/'
      router.push(newPath)
    }
  }

  const handleCtaClick = () => {
    openShopifyAppStore()
  }

  const handleSignInClick = () => {
    setIsMobileMenuOpen(false)
    openShopifyAppStore()
  }

  return {
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
    handleCtaClick,
    handleSignInClick,
  }
}
