import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { HeaderNavItem } from './header.model'

const SCROLL_THRESHOLD = 20
const SCROLL_OFFSET = 80
const MOBILE_SCROLL_DELAY = 100

export function useHeader() {
  const t = useTranslations('header')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = useMemo<HeaderNavItem[]>(
    () => [
      { label: t('features'), id: 'solution' },
      { label: t('pricing'), id: 'pricing' },
      { label: t('faq'), id: 'faq' },
    ],
    [t]
  )

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false)
    setTimeout(() => {
      const element = document.getElementById(id)
      if (element) {
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - SCROLL_OFFSET
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    }, MOBILE_SCROLL_DELAY)
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
    navigation,
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    scrollToSection,
    handleLocaleChange,
  }
}
