import { useState } from 'react'
import { BlockStack, Button, InlineStack, Modal } from '@shopify/polaris'
import { CheckIcon, MenuHorizontalIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type { NeedsActionRowModel } from '../../../../domain/needsActionRow'
import type { ManualConfirmationTarget } from '../../../../domain/useManualConfirmation'

/**
 * A needs-action row's actions, laid out like the confirmations table's: in
 * the table everything sits in a small sheet behind one labelled "more"
 * button; on a card Confirm and WhatsApp sit up front and the sheet keeps the
 * rest.
 *
 * The sheet is a Modal, not a Popover: Polaris' popover keeps the window in
 * its props, and React's dev profiler walks it into the cross-origin Shopify
 * admin frame and throws a SecurityError inside the embedded app.
 */
export function NeedsActionRowActions({
  row,
  target,
  customerLabel,
  onRequestConfirm,
  onViewAll,
  layout = 'inline',
}: {
  row: NeedsActionRowModel
  target: ManualConfirmationTarget
  customerLabel: string
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onViewAll: () => void
  layout?: 'inline' | 'stacked'
}) {
  const t = useTranslations('dashboard')
  const tRow = useTranslations('dashboard.standalone.needsAction')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const isStacked = layout === 'stacked'
  const confirmLabel = t('overview.needsAction.actions.manualConfirmLabel', {
    order: target.orderLabel,
  })
  const whatsappLabel = t('overview.needsAction.actions.whatsappLabel', {
    customer: customerLabel,
  })
  const closeThen = (action: () => void) => () => {
    setIsSheetOpen(false)
    action()
  }

  return (
    <InlineStack gap="200" wrap={false} blockAlign="center">
      {isStacked && row.confirmable && (
        <div className="min-w-0 flex-1">
          <Button
            icon={CheckIcon}
            fullWidth
            accessibilityLabel={confirmLabel}
            onClick={() => onRequestConfirm(target)}
          >
            {t('overview.needsAction.actions.manualConfirm')}
          </Button>
        </div>
      )}
      {isStacked && row.chatUrl && (
        <div className="min-w-0 flex-1">
          <Button
            url={row.chatUrl}
            target="_blank"
            fullWidth
            accessibilityLabel={whatsappLabel}
          >
            {t('overview.needsAction.actions.whatsapp')}
          </Button>
        </div>
      )}
      <Button
        icon={MenuHorizontalIcon}
        accessibilityLabel={tRow('more', { order: target.orderLabel })}
        onClick={() => setIsSheetOpen(true)}
      />
      <Modal
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={t('confirmations.actions.menuTitle', {
          order: target.orderLabel,
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
            {!isStacked && row.chatUrl && (
              <Button
                fullWidth
                url={row.chatUrl}
                target="_blank"
                accessibilityLabel={whatsappLabel}
                onClick={() => setIsSheetOpen(false)}
              >
                {t('overview.needsAction.actions.whatsapp')}
              </Button>
            )}
            {!isStacked && row.confirmable && (
              <Button
                fullWidth
                accessibilityLabel={confirmLabel}
                onClick={closeThen(() => onRequestConfirm(target))}
              >
                {t('overview.needsAction.actions.manualConfirm')}
              </Button>
            )}
            <Button fullWidth onClick={closeThen(onViewAll)}>
              {tRow('viewInList')}
            </Button>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </InlineStack>
  )
}
