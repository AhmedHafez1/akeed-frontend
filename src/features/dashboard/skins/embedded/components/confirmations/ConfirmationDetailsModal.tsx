import {
  Badge,
  BlockStack,
  Box,
  InlineGrid,
  InlineStack,
  Modal,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { useCustomerRecordView } from '../../../../domain/useCustomerRecordView'
import { getVerificationLifecycleSteps } from '../../../../domain/verificationLifecycle'
import {
  formatOrderTitle,
  formatOrderTotal,
  formatTooltipDateTime,
  getLastUpdateAt,
  resolveRowDescriptionKey,
} from '../../../../domain/verificationRow'
import type { VerificationItem } from '../../../../model/dashboard.model'

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <BlockStack gap="050">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        <bdi>{children}</bdi>
      </Text>
    </BlockStack>
  )
}

function DetailsBody({
  verification,
  timeZone,
}: {
  verification: VerificationItem
  timeZone: string
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const customerRecord = useCustomerRecordView(verification.customer_history)
  const time = (iso: string | null | undefined) =>
    formatTooltipDateTime(iso ?? null, locale, timeZone)

  return (
    <BlockStack gap="400">
      <Text as="p" variant="bodyMd" tone="subdued">
        {t(resolveRowDescriptionKey(verification))}
      </Text>

      <InlineGrid columns={2} gap="400">
        <BlockStack gap="050">
          <Fact label={t('table.headings.customer')}>
            {verification.customer_name || t('table.unknownCustomer')}
          </Fact>
          <Text as="span" variant="bodySm" tone="subdued">
            <bdi dir="ltr">
              {verification.customer_phone || t('table.noPhone')}
            </bdi>
          </Text>
        </BlockStack>
        <Fact label={t('table.headings.total')}>
          {formatOrderTotal(verification, locale)}
        </Fact>
      </InlineGrid>

      {customerRecord && (
        <Box
          padding="300"
          borderRadius="200"
          background={
            customerRecord.kind === 'risk'
              ? 'bg-surface-warning'
              : 'bg-surface-secondary'
          }
        >
          <BlockStack gap="100">
            <Text as="span" variant="bodySm" tone="subdued">
              {t('confirmations.customer.heading')}
            </Text>
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {customerRecord.label}
            </Text>
            {customerRecord.kind !== 'new' && (
              <Text as="span" variant="bodySm" tone="subdued">
                {customerRecord.summary}
              </Text>
            )}
          </BlockStack>
        </Box>
      )}

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm">
          {t('table.lifecycle.label')}
        </Text>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {getVerificationLifecycleSteps(verification).map((step) => {
            const stateKey = step.completedByOutcome
              ? `table.lifecycle.completedBy.${step.completedByOutcome}`
              : step.recorded
                ? 'table.lifecycle.recorded'
                : 'table.lifecycle.unrecorded'
            return (
              <li key={step.id}>
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone={step.recorded ? 'success' : undefined}>
                    {t(`table.lifecycle.${step.label}`)}
                  </Badge>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {t(stateKey)}
                    {step.timestamp ? ` · ${time(step.timestamp)}` : ''}
                  </Text>
                </InlineStack>
              </li>
            )
          })}
        </ul>
      </BlockStack>

      <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
        <Fact label={t('table.headings.followUp')}>
          {verification.follow_up_sent_at
            ? `${t('table.followUp.sent')} · ${time(verification.follow_up_sent_at)}`
            : t('table.followUp.notSent')}
        </Fact>
        <Fact label={t('confirmations.headings.orderTime')}>
          {time(verification.created_at)}
        </Fact>
        <Fact label={t('confirmations.headings.updated')}>
          {time(getLastUpdateAt(verification))}
        </Fact>
      </InlineGrid>
    </BlockStack>
  )
}

/**
 * Everything recorded about one order: who, how much, the customer's track
 * record, and each step of the conversation with its time. Read-only; the
 * row's actions stay on the row.
 */
export function ConfirmationDetailsModal({
  verification,
  timeZone,
  onClose,
}: {
  verification: VerificationItem | null
  timeZone: string
  onClose: () => void
}) {
  const t = useTranslations('dashboard')
  return (
    <Modal
      open={verification !== null}
      onClose={onClose}
      title={
        verification
          ? formatOrderTitle(verification, t('table.orderFallbackPrefix'))
          : ''
      }
      secondaryActions={[
        { content: t('confirmations.actions.close'), onAction: onClose },
      ]}
    >
      {verification && (
        <Modal.Section>
          <DetailsBody verification={verification} timeZone={timeZone} />
        </Modal.Section>
      )}
    </Modal>
  )
}
