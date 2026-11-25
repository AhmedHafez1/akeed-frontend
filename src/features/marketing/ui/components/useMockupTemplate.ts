import { HERO_MOCKUP_TEMPLATES } from '@/features/marketing/config/heroMockup'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  formatMessageTotal,
  getMessageLanguageDirection,
  isMessageLanguage,
  MESSAGE_SAMPLE_CUSTOMER_NAMES,
} from '@/shared/lib/messageLanguage'

/** Synthetic orders shown in the page mockups; never real customer data. */
export const DEMO_ORDERS = {
  hero: { number: '1042', amount: '599', currency: 'EGP' },
  flow: { number: '1244', amount: '1445', currency: 'EGP' },
} as const

/**
 * The confirmation template in the page's language, with the demo customer
 * and store names that go with it.
 */
export function useMockupTemplate() {
  const { locale } = useLocaleInfo()
  const language = isMessageLanguage(locale) ? locale : 'en'
  const template = HERO_MOCKUP_TEMPLATES[language]

  return {
    language,
    template,
    direction: getMessageLanguageDirection(language),
    customer: MESSAGE_SAMPLE_CUSTOMER_NAMES[language],
    formatTotal: (order: { amount: string; currency: string }) =>
      formatMessageTotal(order.amount, order.currency, language),
  }
}
