import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  getShippingTrackingView,
  TrackingPage,
  type TrackingPageLabels,
} from '@/features/shipping-tracking'
import { DEFAULT_LOCALE } from '@/shared/lib/locale'

export const dynamic = 'force-dynamic'

/**
 * The Shipped message's Track order button. The backend decides what the
 * code opens: the carrier's page (a redirect to a link it stored), Akeed's
 * page in the message's language, or a neutral "not available" page.
 */
export default async function TrackingLinkPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const view = await getShippingTrackingView(code)
  if (view.kind === 'redirect') redirect(view.url)

  const locale = view.kind === 'page' ? view.language : DEFAULT_LOCALE
  const t = await getTranslations({ locale, namespace: 'trackingLink' })
  const labels: TrackingPageLabels = {
    trackingNumber: t('trackingNumber'),
    copy: t('copy'),
    copied: t('copied'),
    courierContact: t('courierContact'),
    unavailableTitle: t('unavailableTitle'),
    unavailableBody: t('unavailableBody'),
    sentWith: t('sentWith'),
  }

  if (view.kind !== 'page') {
    return <TrackingPage state="unavailable" labels={labels} />
  }
  const { orderNumber } = view
  return (
    <TrackingPage
      state="page"
      labels={labels}
      heading={
        orderNumber
          ? t.rich('title', {
              number: orderNumber,
              order: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
            })
          : t('titleNoOrder')
      }
      storeName={view.storeName}
      courier={view.courier}
      trackingNumber={view.trackingNumber}
    />
  )
}
