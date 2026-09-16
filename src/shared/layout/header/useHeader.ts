import { type MouseEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
// Deep import on purpose: `@/features/marketing` re-exports HomePage, so the
// barrel would pull the entire landing tree into every public-chrome route.
import { getAcquisitionTargets } from '@/features/marketing/domain/acquisitionPaths'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { scrollToElement } from '@/shared/lib/scroll'
import { HeaderNavItem } from './header.model'

const SCROLL_THRESHOLD = 20
const MOBILE_SCROLL_DELAY = 100
// Every in-page nav anchor must be listed here, or the link falls through to a
// full navigation instead of smooth-scrolling.
const SCROLLABLE_SECTIONS = new Set([
  'trust',
  'how-it-works',
  'pricing',
  'who-its-for',
  'faq',
])

function getPathWithoutLocale(pathname: string): string {
  return '/' + pathname.split('/').slice(2).join('/')
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
        href: withLocale('/#trust', locale),
        label: t('features'),
        id: 'trust',
      },
      {
        href: withLocale('/#how-it-works', locale),
        label: t('how_it_works'),
        id: 'how-it-works',
      },
      {
        href: withLocale('/#pricing', locale),
        label: t('pricing'),
        id: 'pricing',
      },
      {
        href: withLocale('/docs', locale),
        label: t('resources'),
        id: 'resources',
        children: [
          {
            href: withLocale('/#who-its-for', locale),
            label: t('audience'),
            id: 'who-its-for',
          },
          { href: withLocale('/docs', locale), label: t('docs'), id: 'docs' },
          { href: withLocale('/#faq', locale), label: t('faq'), id: 'faq' },
        ],
      },
    ],
    [locale, t]
  )

  const loginHref = withLocale('/login', locale)

  const acquisitionTargets = useMemo(
    () => getAcquisitionTargets(locale),
    [locale]
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

    if (!SCROLLABLE_SECTIONS.has(id)) return

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

  return {
    t,
    locale,
    homeHref,
    loginHref,
    navigation,
    acquisitionTargets,
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    scrollToSection,
    handleHomeClick,
    handleLocaleChange,
  }
}
