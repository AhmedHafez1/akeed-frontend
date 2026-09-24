import { useState } from 'react'
import { BlockStack, Button, InlineStack, Modal } from '@shopify/polaris'
import { MenuHorizontalIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { canCancelOrder } from '../../../../domain/cancellation'
import { canSendShippingInfo } from '../../../../domain/confirmationRowStatus'
import {
  canRetryVerification,
  hasCapability,
} from '../../../../domain/verificationLifecycle'
import {
  customerDisplayName,
  formatOrderAmount,
  formatPhoneInternational,
  whatsAppChatUrl,
} from '../../../../lib/orderDisplay'
import type { VerificationItem } from '../../../../model/dashboard.model'

export interface ConfirmationRowActionHandlers {
  onRequestConfirm: (row: VerificationItem, orderLabel: string) => void
  onRequestCancel: (row: VerificationItem, orderLabel: string) => void
  onRetry: (row: VerificationItem) => void
}

interface RowActionItem {
  id: string
  content: string
  destructive?: boolean
  onAction: () => void
}

interface RowLink {
  url: string
  content: string
  accessibilityLabel: string
}

/**
 * Which actions a row offers: one WhatsApp link up front (a chat for a row
 * waiting on the merchant, shipping details for a confirmed order) and the
 * less common actions for the "more" sheet.
 */
function useConfirmationRowActions({
  row,
  orderLabel,
  canWrite,
  canRetry,
  handlers,
}: {
  row: VerificationItem
  orderLabel: string
  canWrite: boolean
  canRetry: boolean
  handlers: ConfirmationRowActionHandlers
}): { link: RowLink | null; items: RowActionItem[] } {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const name = customerDisplayName(row.customer_name)
  const customer = name ?? formatPhoneInternational(row.customer_phone)

  let link: RowLink | null = null
  if (row.action_reason && row.action_reason !== 'delivery_failed') {
    const url = whatsAppChatUrl(row.customer_phone)
    link = url
      ? {
          url,
          content: t('overview.needsAction.actions.whatsapp'),
          accessibilityLabel: t('overview.needsAction.actions.whatsappLabel', {
            customer,
          }),
        }
      : null
  } else if (canSendShippingInfo(row)) {
    const message = t('confirmations.shipping.message', {
      customer: name ?? t('confirmations.shipping.customerFallback'),
      order: orderLabel,
      total: formatOrderAmount(row.total_price, row.currency, locale),
    })
    const url = whatsAppChatUrl(row.customer_phone, message)
    link = url
      ? {
          url,
          content: t('confirmations.actions.sendShipping'),
          accessibilityLabel: t('confirmations.actions.sendShippingLabel', {
            customer,
          }),
        }
      : null
  }

  const items: RowActionItem[] = []
  if (
    canWrite &&
    row.action_reason &&
    hasCapability(row.capabilities, 'merchant_manual_confirmation')
  ) {
    items.push({
      id: 'confirm',
      content: t('overview.needsAction.actions.manualConfirm'),
      onAction: () => handlers.onRequestConfirm(row, orderLabel),
    })
  }
  if (canRetry && canRetryVerification(row.capabilities)) {
    items.push({
      id: 'retry',
      content: t('table.actions.retry'),
      onAction: () => handlers.onRetry(row),
    })
  }
  if (canWrite && canCancelOrder(row)) {
    items.push({
      id: 'cancel',
      content: t('table.actions.cancelOrder'),
      destructive: true,
      onAction: () => handlers.onRequestCancel(row, orderLabel),
    })
  }

  return { link, items }
}

/**
 * Nothing for rows that need nothing. The main WhatsApp link sits up front;
 * the rest open in a small sheet behind one labelled "more" button.
 *
 * The sheet is a Modal, not a Popover: Polaris' popover keeps the window in
 * its props, and React's dev profiler walks it into the cross-origin Shopify
 * admin frame and throws a SecurityError inside the embedded app.
 */
export function ConfirmationRowActions({
  row,
  orderLabel,
  canWrite,
  canRetry,
  isActing,
  handlers,
  layout = 'inline',
}: {
  row: VerificationItem
  orderLabel: string
  canWrite: boolean
  canRetry: boolean
  isActing: boolean
  handlers: ConfirmationRowActionHandlers
  /** `stacked` stretches the main link across a card. */
  layout?: 'inline' | 'stacked'
}) {
  const t = useTranslations('dashboard')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { link, items } = useConfirmationRowActions({
    row,
    orderLabel,
    canWrite,
    canRetry,
    handlers,
  })

  if (!link && items.length === 0) return null
  const isStacked = layout === 'stacked'

  return (
    <InlineStack gap="200" wrap={false} blockAlign="center">
      {link && (
        <div className={isStacked ? 'min-w-0 flex-1' : undefined}>
          <Button
            url={link.url}
            target="_blank"
            fullWidth={isStacked}
            accessibilityLabel={link.accessibilityLabel}
          >
            {link.content}
          </Button>
        </div>
      )}
      {items.length > 0 && (
        <>
          <Button
            icon={MenuHorizontalIcon}
            disabled={isActing}
            loading={isActing}
            accessibilityLabel={t('confirmations.actions.more', {
              order: orderLabel,
            })}
            onClick={() => setIsSheetOpen(true)}
          />
          <Modal
            open={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            title={t('confirmations.actions.menuTitle', { order: orderLabel })}
            size="small"
            secondaryActions={[
              {
                content: t('confirmations.actions.close'),
                onAction: () => setIsSheetOpen(false),
              },
            ]}
          >
            <Modal.Section>
              <BlockStack gap="200">
                {items.map((item) => (
                  <Button
                    key={item.id}
                    fullWidth
                    tone={item.destructive ? 'critical' : undefined}
                    onClick={() => {
                      setIsSheetOpen(false)
                      item.onAction()
                    }}
                  >
                    {item.content}
                  </Button>
                ))}
              </BlockStack>
            </Modal.Section>
          </Modal>
        </>
      )}
    </InlineStack>
  )
}
