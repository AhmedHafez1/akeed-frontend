import { usePathname } from 'next/navigation'
import { getLocaleFromPathname } from '@/lib/locale'

export function useLocaleInfo() {
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)
  const isRTL = locale === 'ar'

  return { locale, isRTL }
}
