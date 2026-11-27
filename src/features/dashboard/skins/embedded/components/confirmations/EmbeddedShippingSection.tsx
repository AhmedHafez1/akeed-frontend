import {
  Badge,
  Banner,
  BlockStack,
  Icon,
  InlineGrid,
  InlineStack,
  Link,
  Text,
} from '@shopify/polaris'
import { CheckIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import type { ShippingDeliveryBadge } from '../../../../domain/shippingStatus'
import { useShippingDetails } from '../../../../domain/useShippingDetails'
import { useShippingResolve } from '../../../../domain/useShippingResolve'
import type { VerificationItem } from '../../../../model/dashboard.model'

const TONES: Record<
  ShippingDeliveryBadge,
  'info' | 'attention' | 'critical' | undefined
> = {
  sent: 'info',
  undeliverable: 'attention',
  failedToSend: 'critical',
  notSent: undefined,
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <BlockStack gap="050">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <div>{children}</div>
    </BlockStack>
  )
}

/** The open request, with "Mark done" for owners and admins. */
function OpenRequestBanner({
  verificationId,
  text,
  canAct,
}: {
  verificationId: string
  text: string
  canAct: boolean
}) {
  const t = useTranslations('dashboard.shipping')
  const { shopify } = useAkeedMode()
  const { resolve, pendingId } = useShippingResolve({
    onDone: (message) => shopify?.toast.show(message),
    onError: (message) => shopify?.toast.show(message, { isError: true }),
  })
  return (
    <Banner
      tone="warning"
      action={
        canAct
          ? {
              content: t('markDone'),
              loading: pendingId === verificationId,
              onAction: () => void resolve(verificationId),
            }
          : undefined
      }
    >
      <p>
        {text} {canAct ? t('details.contactHint') : null}
      </p>
    </Banner>
  )
}

/**
 * The order's Shipped message: why it was sent, its status or why it was not
 * sent, tracking and the customer's reply. An open request, or a customer the
 * message did not reach, offers "Mark done" to owners and admins.
 */
export function EmbeddedShippingSection({
  verification,
  timeZone,
  canAct,
}: {
  verification: VerificationItem
  timeZone: string
  canAct: boolean
}) {
  const t = useTranslations('dashboard.shipping')
  const view = useShippingDetails(
    verification.shipping,
    verification.action_reason,
    timeZone
  )
  if (!view) return null

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        {t('details.title')}
      </Text>
      {view.open && (
        <OpenRequestBanner
          verificationId={verification.id}
          text={view.open}
          canAct={canAct}
        />
      )}
      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
        <Fact label={t('details.trigger')}>
          <Text as="p" variant="bodyMd">
            <bdi>{view.trigger}</bdi>
          </Text>
        </Fact>
        <Fact label={t('details.statusLabel')}>
          <BlockStack gap="100" inlineAlign="start">
            <Badge tone={view.badge ? TONES[view.badge] : undefined}>
              {view.status}
            </Badge>
            <Text as="p" variant="bodySm" tone="subdued">
              {view.reason ?? view.time}
            </Text>
          </BlockStack>
        </Fact>
        {view.tracking && (
          <Fact label={t('details.tracking')}>
            <InlineStack gap="200" blockAlign="center">
              {view.tracking.number && (
                <Text as="span" variant="bodyMd">
                  <bdi dir="ltr">{view.tracking.number}</bdi>
                </Text>
              )}
              {view.tracking.url && (
                <Link url={view.tracking.url} target="_blank">
                  {t('details.track')}
                </Link>
              )}
            </InlineStack>
          </Fact>
        )}
        {view.reply && (
          <Fact label={t('details.reply')}>
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {view.reply}
            </Text>
          </Fact>
        )}
      </InlineGrid>
      {view.resolved && (
        <InlineStack gap="100" blockAlign="center" wrap={false}>
          <span aria-hidden="true">
            <Icon source={CheckIcon} tone="success" />
          </span>
          <Text as="p" variant="bodySm" tone="subdued">
            {view.resolved}
          </Text>
        </InlineStack>
      )}
    </BlockStack>
  )
}
