import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, isRtlLocale } from '@/shared/lib/locale'

export function useLocaleInfo() {
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)
  const isRTL = isRtlLocale(locale)

  return { locale, isRTL }
}
