import { useState } from 'react'
import { BlockStack, Button, InlineStack, Modal } from '@shopify/polaris'
import { MenuHorizontalIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import {
  planConfirmationRowActions,
  type ConfirmationRowActionHandlers,
} from '../../../../domain/confirmationRowActions'
import {
  useConfirmationRowLink,
  type ConfirmationRowLink,
} from '../../../../domain/useConfirmationRowLink'
import type { VerificationItem } from '../../../../model/dashboard.model'

export type { ConfirmationRowActionHandlers }

interface RowActionItem {
  id: string
  content: string
  destructive?: boolean
  onAction: () => void
}

/**
 * Which actions a row offers, as the shared plan decides: one WhatsApp link
 * up front and the less common actions for the "more" sheet.
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
}): { link: ConfirmationRowLink | null; items: RowActionItem[] } {
  const t = useTranslations('dashboard')
  const plan = planConfirmationRowActions(row, { canWrite, canRetry })
  const link = useConfirmationRowLink(row, orderLabel, plan.primary)

  const items: RowActionItem[] = []
  if (plan.canConfirm) {
    items.push({
      id: 'confirm',
      content: t('overview.needsAction.actions.manualConfirm'),
      onAction: () => handlers.onRequestConfirm(row, orderLabel),
    })
  }
  if (plan.canRetry) {
    items.push({
      id: 'retry',
      content: t('table.actions.retry'),
      onAction: () => handlers.onRetry(row),
    })
  }
  if (plan.canCancel) {
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
