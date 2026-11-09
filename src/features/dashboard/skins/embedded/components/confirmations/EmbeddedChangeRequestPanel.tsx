'use client'

import { useState } from 'react'
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import {
  AlertTriangleIcon,
  ChatIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  PhoneIcon,
  RefreshIcon,
  XSmallIcon,
} from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard'
import {
  useChangeRequestPanel,
  type ChangeRequestFeedback,
} from '../../../../domain/useChangeRequestPanel'
import type { ChangeRequestSummary } from '../../../../model/dashboard.model'

/**
 * The embedded order modal's change-request section: the same facts and
 * outcomes as the standalone panel, in Polaris. Cancelling asks first, in
 * place of the actions, since the modal cannot open a second modal.
 */
export function EmbeddedChangeRequestPanel({
  verificationId,
  orderLabel,
  summary,
  phone,
  timeZone,
  canAct,
}: {
  verificationId: string
  orderLabel: string
  summary: ChangeRequestSummary
  phone: string | null
  timeZone: string
  canAct: boolean
}) {
  const t = useTranslations('dashboard.changeRequest')
  const tDashboard = useTranslations('dashboard')
  const panel = useChangeRequestPanel({
    verificationId,
    summary,
    phone,
    timeZone,
    canAct,
  })
  const [feedback, setFeedback] = useState<ChangeRequestFeedback | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const { copied, copy } = useCopyToClipboard(() =>
    setFeedback({ tone: 'critical', text: t('copyError') })
  )
  const { resend, contact } = panel
  const failed = resend.kind === 'failed'

  const run = (action: 'confirm' | 'cancel' | 'resend') =>
    void panel.run(action).then((result) => {
      if (action === 'cancel') setConfirmingCancel(false)
      if (result) setFeedback(result)
    })

  return (
    <BlockStack gap="400">
      <Banner tone="warning" title={t('panelTitle')}>
        <BlockStack gap="200">
          {['failed', 'skipped'].includes(
            summary.merchant_email?.status ?? ''
          ) && (
            <Text as="p" variant="bodySm" tone="critical">
              {t('emailUnavailable')}
            </Text>
          )}
          <Text as="p" variant="bodySm" tone="subdued">
            {panel.age}
          </Text>
          {panel.ack === 'sent' ? (
            <InlineGrid columns="20px 1fr" gap="100" alignItems="start">
              <Icon source={CheckIcon} tone="success" />
              <Text as="p" variant="bodySm" tone="subdued">
                {t('ackSent')}
              </Text>
            </InlineGrid>
          ) : panel.ack === 'skipped' || panel.ack === 'failed' ? (
            <InlineGrid columns="20px 1fr" gap="100" alignItems="start">
              <Icon source={AlertTriangleIcon} tone="critical" />
              <Text as="p" variant="bodySm" tone="critical">
                {t(panel.ack === 'skipped' ? 'ackSkipped' : 'ackFailed')}
              </Text>
            </InlineGrid>
          ) : null}
        </BlockStack>
      </Banner>

      {feedback && (
        <Banner
          tone={
            feedback.tone === 'critical'
              ? 'critical'
              : feedback.tone === 'info'
                ? 'info'
                : 'success'
          }
          onDismiss={() => setFeedback(null)}
        >
          {feedback.text}
        </Banner>
      )}

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm">
          {t('contactHeading')}
        </Text>
        <InlineStack gap="200">
          <Button
            icon={ChatIcon}
            disabled={!contact}
            url={contact?.whatsAppUrl}
            target="_blank"
          >
            {t('openWhatsapp')}
          </Button>
          <Button icon={PhoneIcon} disabled={!contact} url={contact?.callUrl}>
            {t('call')}
          </Button>
          <Button
            icon={ClipboardIcon}
            disabled={!contact}
            onClick={() => {
              if (contact) void copy(contact.copyText)
            }}
          >
            {copied ? t('copied') : t('copy')}
          </Button>
        </InlineStack>
        {!contact && (
          <Text as="p" variant="bodySm" tone="caution">
            {t('noPhone')}
          </Text>
        )}
      </BlockStack>

      {canAct && (
        <>
          <Divider />
          {confirmingCancel ? (
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                {tDashboard('confirmations.actions.cancelTitle', {
                  order: orderLabel,
                })}
              </Text>
              <Text as="p" variant="bodyMd">
                {tDashboard('table.actions.cancelOrderConfirmDescription')}
              </Text>
              <InlineStack align="end" gap="200">
                <Button
                  disabled={panel.pending === 'cancel'}
                  onClick={() => setConfirmingCancel(false)}
                >
                  {tDashboard('table.actions.keepOrder')}
                </Button>
                <Button
                  variant="primary"
                  tone="critical"
                  loading={panel.pending === 'cancel'}
                  onClick={() => run('cancel')}
                >
                  {tDashboard('table.actions.confirmCancelOrder')}
                </Button>
              </InlineStack>
            </BlockStack>
          ) : (
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                {t('resultHeading')}
              </Text>
              <Button
                variant="primary"
                icon={CheckIcon}
                fullWidth
                disabled={panel.disabled.confirm}
                loading={panel.pending === 'confirm'}
                onClick={() => run('confirm')}
              >
                {t('confirmAfter')}
              </Button>
              <Button
                icon={RefreshIcon}
                fullWidth
                disabled={panel.disabled.resend}
                loading={panel.pending === 'resend'}
                onClick={() => run('resend')}
              >
                {t('resend')}
              </Button>
              {panel.resendText && (
                <Banner
                  tone={failed ? 'critical' : 'info'}
                  icon={
                    failed
                      ? AlertTriangleIcon
                      : resend.kind === 'scheduled'
                        ? ClockIcon
                        : RefreshIcon
                  }
                  action={
                    failed && resend.retryable
                      ? {
                          content: t('retry'),
                          disabled: panel.disabled.resend,
                          onAction: () => run('resend'),
                        }
                      : undefined
                  }
                >
                  {panel.resendText}
                </Banner>
              )}
              <Box
                paddingBlockStart="200"
                borderBlockStartWidth="025"
                borderColor="border"
              >
                <Button
                  tone="critical"
                  icon={XSmallIcon}
                  fullWidth
                  disabled={panel.disabled.cancel}
                  onClick={() => setConfirmingCancel(true)}
                >
                  {t('cancelAfter')}
                </Button>
              </Box>
            </BlockStack>
          )}
        </>
      )}
    </BlockStack>
  )
}
