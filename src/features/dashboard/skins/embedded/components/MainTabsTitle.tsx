import { Badge, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { MAIN_TABS, type MainTabId } from '../../../domain/mainTabs'
import { formatCount } from '../../../lib/orderDisplay'

interface MainTabsTitleProps {
  active: MainTabId
  onSelect: (tab: MainTabId) => void
  /** Orders waiting on the merchant; shown beside the confirmations link. */
  needsActionCount?: number | null
}

/**
 * The page title and the switch between the two main views in one row: the
 * open view is the heading, the other is a link at the same size, which is
 * the size Polaris gives the settings page title. A count
 * beside "Confirmations" says orders are waiting before the merchant opens it.
 */
export function MainTabsTitle({
  active,
  onSelect,
  needsActionCount,
}: MainTabsTitleProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const waiting = needsActionCount ?? 0

  return (
    <nav
      aria-label={t('tabs.label')}
      className="flex flex-wrap items-end gap-x-5 gap-y-2"
    >
      {MAIN_TABS.map((id) =>
        id === active ? (
          <span
            key={id}
            className="border-b-2 border-(--p-color-border-inverse) pb-1"
          >
            <Text as="h1" variant="headingLg">
              {t(`tabs.${id}`)}
            </Text>
          </span>
        ) : (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 border-solid border-transparent bg-transparent p-0 pb-1 text-(--p-color-text-secondary) hover:border-(--p-color-border) hover:text-(--p-color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-color-border-focus)"
          >
            <Text as="span" variant="headingLg" fontWeight="regular">
              {t(`tabs.${id}`)}
            </Text>
            {id === 'confirmations' && waiting > 0 && (
              <span title={t('confirmations.tabs.needs_action')}>
                <Badge tone="attention">{formatCount(waiting, locale)}</Badge>
                <span className="sr-only">
                  {' '}
                  {t('confirmations.tabs.needs_action')}
                </span>
              </span>
            )}
          </button>
        )
      )}
    </nav>
  )
}
