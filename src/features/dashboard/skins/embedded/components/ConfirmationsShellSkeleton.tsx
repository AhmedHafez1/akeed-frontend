'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  BlockStack,
  Card,
  Page,
  SkeletonBodyText,
  Tabs,
} from '@shopify/polaris'
import {
  CONFIRMATIONS_TABS,
  resolveConfirmationsTab,
} from '../../../domain/confirmationsUrlState'
import { EmbeddedPageHeader } from './overview/EmbeddedPageHeader'
import { MainTabsTitle } from './MainTabsTitle'
import { VerificationsTableSkeleton } from './VerificationsTableSkeleton'

const noop = () => {}

/**
 * The confirmations view while the embedded session loads: the same width,
 * title, filter tabs and table as the real page, so the page does not change
 * shape when the data arrives. Nothing in it can be pressed yet.
 */
export function ConfirmationsShellSkeleton() {
  const t = useTranslations('dashboard')
  const searchParams = useSearchParams()
  const selected = CONFIRMATIONS_TABS.indexOf(
    resolveConfirmationsTab(searchParams.get('filter'))
  )
  const tabs = CONFIRMATIONS_TABS.map((id) => ({
    id: `confirmations-skeleton-tab-${id}`,
    content: t(`confirmations.tabs.${id}`),
  }))

  return (
    <Page fullWidth>
      <div className="mx-auto w-full max-w-330" aria-busy="true" inert>
        <BlockStack gap="500">
          <EmbeddedPageHeader
            title={<MainTabsTitle active="confirmations" onSelect={noop} />}
            subtitle={t('confirmations.subtitle')}
            actions={
              <>
                <div className="w-36">
                  <SkeletonBodyText lines={1} />
                </div>
                <div className="w-48">
                  <SkeletonBodyText lines={1} />
                </div>
              </>
            }
          />
          <Card padding="0">
            <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <Tabs tabs={tabs} selected={selected} onSelect={noop} />
              </div>
              <div className="w-full lg:w-96">
                <SkeletonBodyText lines={1} />
              </div>
            </div>
            <VerificationsTableSkeleton />
          </Card>
        </BlockStack>
      </div>
    </Page>
  )
}
