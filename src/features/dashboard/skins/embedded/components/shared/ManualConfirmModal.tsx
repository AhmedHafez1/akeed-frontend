import { Modal, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { ManualConfirmationTarget } from '../../../../domain/useManualConfirmation'

/** Asks before a manual confirmation, since it tags the order in Shopify. */
export function ManualConfirmModal({
  target,
  isConfirming,
  onConfirm,
  onDismiss,
}: {
  target: ManualConfirmationTarget | null
  isConfirming: boolean
  onConfirm: () => void
  onDismiss: () => void
}) {
  const t = useTranslations('dashboard.overview.needsAction.confirmDialog')
  return (
    <Modal
      open={target !== null}
      onClose={onDismiss}
      title={t('title', { order: target?.orderLabel ?? '' })}
      primaryAction={{
        content: t('confirm'),
        onAction: onConfirm,
        loading: isConfirming,
      }}
      secondaryActions={[
        { content: t('cancel'), onAction: onDismiss, disabled: isConfirming },
      ]}
    >
      <Modal.Section>
        <Text as="p" variant="bodyMd">
          {t('body')}
        </Text>
      </Modal.Section>
    </Modal>
  )
}
