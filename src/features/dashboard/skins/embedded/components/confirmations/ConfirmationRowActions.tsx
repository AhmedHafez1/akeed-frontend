import { useState } from 'react'
import { BlockStack, Box, Button, InlineStack, Modal } from '@shopify/polaris'
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
 * Nothing for rows that need nothing. In the table every action, the WhatsApp
 * link included, sits in a small sheet behind one labelled "more" button, so
 * rows stay quiet. On a card only the link sits up front; the sheet keeps the
 * rest, Confirm included.
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
  const showSheet = items.length > 0 || (!isStacked && link !== null)

  return (
    <Box paddingBlockStart={isStacked ? '100' : '0'}>
      <InlineStack gap="200" wrap={false} blockAlign="center">
        {isStacked && link && (
          <div className="min-w-0 flex-1">
            <Button
              url={link.url}
              target="_blank"
              fullWidth
              accessibilityLabel={link.accessibilityLabel}
            >
              {link.content}
            </Button>
          </div>
        )}
        {showSheet && (
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
              title={t('confirmations.actions.menuTitle', {
                order: orderLabel,
              })}
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
                  {!isStacked && link && (
                    <Button
                      fullWidth
                      url={link.url}
                      target="_blank"
                      accessibilityLabel={link.accessibilityLabel}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {link.content}
                    </Button>
                  )}
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
    </Box>
  )
}
