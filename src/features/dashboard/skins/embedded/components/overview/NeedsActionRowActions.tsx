import { useState } from 'react'
import { BlockStack, Button, InlineStack, Modal } from '@shopify/polaris'
import { ChatIcon, CheckIcon, MenuHorizontalIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useShippingResolve } from '../../../../domain/useShippingResolve'
import type { NeedsActionRowModel } from '../../../../domain/needsActionRow'
import type { ManualConfirmationTarget } from '../../../../domain/useManualConfirmation'

/** A delivery request or an unreached customer: "Mark done", then contact. */
function ShippingRowActions({
  shipping,
  target,
  whatsappLabel,
  isStacked,
  onViewAll,
}: {
  shipping: NonNullable<NeedsActionRowModel['shipping']>
  target: ManualConfirmationTarget
  whatsappLabel: string
  isStacked: boolean
  onViewAll: () => void
}) {
  const t = useTranslations('dashboard')
  const tRow = useTranslations('dashboard.standalone.needsAction')
  const tChange = useTranslations('dashboard.changeRequest')
  const tShipping = useTranslations('dashboard.shipping')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { shopify } = useAkeedMode()
  const { resolve, pendingId } = useShippingResolve({
    onDone: (message) => shopify?.toast.show(message),
    onError: (message) => shopify?.toast.show(message, { isError: true }),
  })
  const closeThen = (action: () => void) => () => {
    setIsSheetOpen(false)
    action()
  }
  const { contact, canResolve } = shipping
  const isResolving = pendingId === target.verificationId
  const markDone = () => void resolve(target.verificationId)
  return (
    <InlineStack gap="200" wrap={false} blockAlign="center">
      {canResolve && (
        <div className={isStacked ? 'min-w-0 flex-1' : undefined}>
          <Button
            variant={isStacked ? 'primary' : undefined}
            size={isStacked ? undefined : 'slim'}
            icon={CheckIcon}
            fullWidth={isStacked}
            loading={isResolving}
            onClick={markDone}
          >
            {tShipping('markDone')}
          </Button>
        </div>
      )}
      {isStacked && contact && (
        <Button
          icon={ChatIcon}
          url={contact.whatsAppUrl}
          target="_blank"
          accessibilityLabel={whatsappLabel}
        />
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
            {contact && (
              <Button fullWidth url={contact.whatsAppUrl} target="_blank">
                {tChange('openWhatsapp')}
              </Button>
            )}
            {contact && (
              <Button fullWidth url={contact.callUrl}>
                {tChange('call')}
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
  onHandle,
  layout = 'inline',
}: {
  row: NeedsActionRowModel
  target: ManualConfirmationTarget
  customerLabel: string
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onViewAll: () => void
  /** Opens the order's change request; used only for such a row. */
  onHandle: () => void
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
  const tChange = useTranslations('dashboard.changeRequest')

  if (row.shipping) {
    return (
      <ShippingRowActions
        shipping={row.shipping}
        target={target}
        whatsappLabel={whatsappLabel}
        isStacked={isStacked}
        onViewAll={onViewAll}
      />
    )
  }

  if (row.changeRequest) {
    const { contact } = row.changeRequest
    return (
      <InlineStack gap="200" wrap={false} blockAlign="center">
        {isStacked && (
          <div className="min-w-0 flex-1">
            <Button variant="primary" fullWidth onClick={onHandle}>
              {tChange('handle')}
            </Button>
          </div>
        )}
        {isStacked && contact && (
          <Button
            icon={ChatIcon}
            url={contact.whatsAppUrl}
            target="_blank"
            accessibilityLabel={whatsappLabel}
          />
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
              <Button variant="primary" fullWidth onClick={closeThen(onHandle)}>
                {tChange('handle')}
              </Button>
              <Button
                fullWidth
                disabled={!contact}
                url={contact?.whatsAppUrl}
                target="_blank"
              >
                {tChange('openWhatsapp')}
              </Button>
              <Button fullWidth disabled={!contact} url={contact?.callUrl}>
                {tChange('call')}
              </Button>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </InlineStack>
    )
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
