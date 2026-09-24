import { useState } from 'react'
import { ActionList, Button, InlineStack, Popover } from '@shopify/polaris'
import { MenuHorizontalIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { canCancelOrder } from '../../../../domain/cancellation'
import {
  canRetryVerification,
  hasCapability,
} from '../../../../domain/verificationLifecycle'
import {
  customerDisplayName,
  formatPhoneInternational,
  whatsAppChatUrl,
} from '../../../../lib/orderDisplay'
import type { VerificationItem } from '../../../../model/dashboard.model'

export interface ConfirmationRowActionHandlers {
  onRequestConfirm: (row: VerificationItem, orderLabel: string) => void
  onRequestCancel: (row: VerificationItem, orderLabel: string) => void
  onRetry: (row: VerificationItem) => void
}

/**
 * Nothing for rows that need nothing. A row waiting on the merchant gets
 * "راسله واتساب" up front; the less common actions (confirm by hand, cancel a
 * no-reply order, retry a send) sit behind one labelled "more" button so the
 * column stays as quiet as the design.
 */
export function ConfirmationRowActions({
  row,
  orderLabel,
  canWrite,
  canRetry,
  isActing,
  handlers,
}: {
  row: VerificationItem
  orderLabel: string
  canWrite: boolean
  canRetry: boolean
  isActing: boolean
  handlers: ConfirmationRowActionHandlers
}) {
  const t = useTranslations('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const chatUrl =
    row.action_reason && row.action_reason !== 'delivery_failed'
      ? whatsAppChatUrl(row.customer_phone)
      : null

  const items = [
    canWrite &&
    row.action_reason &&
    hasCapability(row.capabilities, 'merchant_manual_confirmation')
      ? {
          content: t('overview.needsAction.actions.manualConfirm'),
          onAction: () => handlers.onRequestConfirm(row, orderLabel),
        }
      : null,
    canRetry && canRetryVerification(row.capabilities)
      ? {
          content: t('table.actions.retry'),
          onAction: () => handlers.onRetry(row),
        }
      : null,
    canWrite && canCancelOrder(row)
      ? {
          content: t('table.actions.cancelOrder'),
          destructive: true,
          onAction: () => handlers.onRequestCancel(row, orderLabel),
        }
      : null,
  ].filter((item) => item !== null)

  if (!chatUrl && items.length === 0) return null
  const customer =
    customerDisplayName(row.customer_name) ??
    formatPhoneInternational(row.customer_phone)

  return (
    <InlineStack gap="200" wrap={false} blockAlign="center">
      {chatUrl && (
        <Button
          url={chatUrl}
          target="_blank"
          accessibilityLabel={t('overview.needsAction.actions.whatsappLabel', {
            customer,
          })}
        >
          {t('overview.needsAction.actions.whatsapp')}
        </Button>
      )}
      {items.length > 0 && (
        <Popover
          active={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activator={
            <Button
              icon={MenuHorizontalIcon}
              disabled={isActing}
              loading={isActing}
              accessibilityLabel={t('confirmations.actions.more', {
                order: orderLabel,
              })}
              onClick={() => setIsMenuOpen((open) => !open)}
            />
          }
        >
          <ActionList
            actionRole="menuitem"
            items={items.map((item) => ({
              ...item,
              onAction: () => {
                setIsMenuOpen(false)
                item.onAction()
              },
            }))}
          />
        </Popover>
      )}
    </InlineStack>
  )
}
