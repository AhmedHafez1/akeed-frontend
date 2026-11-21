'use client'

import { useState } from 'react'
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Link,
  List,
  Modal,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
} from '@shopify/polaris'
import { CheckIcon, AlertCircleIcon } from '@shopify/polaris-icons'
import { useLocale, useTranslations } from 'next-intl'
import {
  serverErrorKey,
  useStatusNoteText,
  useWhatsappTab,
  type WhatsappProgressRow,
  type WhatsappStatusNote,
  type WhatsappTabModel,
} from '@/features/whatsapp-connect'
import { WhatsappNumberHeader } from '@/features/settings/skins/shared/WhatsappNumberHeader'
import { buildDocsArticleHref } from '@/shared/lib/docs-links'
import { resolveSupportedLocale } from '@/shared/lib/locale'

/** The same connection facts and actions in native Polaris. */
export function WhatsappTab() {
  const t = useTranslations('whatsappConnect.tab')
  const tErrors = useTranslations('whatsappConnect.errors')
  const locale = resolveSupportedLocale(useLocale())
  const model = useWhatsappTab()
  const [confirming, setConfirming] = useState(false)
  if (model.status === 'loading')
    return (
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={4} />
        </BlockStack>
      </Card>
    )
  if (model.status === 'error')
    return (
      <Banner
        tone="critical"
        title={t('load.title')}
        action={{ content: t('load.retry'), onAction: model.retry }}
      >
        <p>{t('load.body')}</p>
      </Banner>
    )
  const view = model.view
  if (view.kind === 'hidden') return null
  const helpUrl = buildDocsArticleHref({ locale, article: 'ownWhatsappNumber' })
  const close = () => {
    if (!model.disconnect.isPending) {
      setConfirming(false)
      model.disconnect.clearError()
    }
  }
  return (
    <Card>
      {view.kind === 'unconnected' ? (
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            {t('number.title')}
          </Text>
          <Text as="p" tone="subdued">
            {t('connect.body')}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            <NoteText note={view.note} />
          </Text>
          <ConnectAction
            model={model}
            canConnect={view.canConnect}
            label={t('connect.action')}
          />
        </BlockStack>
      ) : (
        <>
          <BlockStack gap="400">
            <WhatsappNumberHeader connection={view} />
            {view.progress.rows.length > 0 ? (
              <div>
                <ol
                  aria-label={t('progress.label')}
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                >
                  {view.progress.rows.map((row) => (
                    <ProgressRow
                      key={row.id}
                      row={row}
                      isOwner={view.isOwner}
                      helpUrl={helpUrl}
                      onReconnect={() => setConfirming(true)}
                    />
                  ))}
                </ol>
                {view.note.key && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    <NoteText note={view.note} />
                  </Text>
                )}
              </div>
            ) : (
              <Box
                borderBlockStartWidth="025"
                borderColor="border"
                paddingBlockStart="400"
              >
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    {t('reconnect.title')}
                  </Text>
                  <Text as="p" tone="subdued">
                    <NoteText note={view.note} />
                    {view.banners.some(
                      (banner) => banner.key === 'disconnect.primary_inactivity'
                    ) && ` ${t('progress.issues.inactive')}`}
                  </Text>
                  {view.canReconnect ? (
                    <ConnectAction
                      model={model}
                      canConnect
                      label={t('reconnect.action')}
                    />
                  ) : (
                    <Text as="p" tone="subdued">
                      {t(
                        view.isOwner
                          ? view.reconnectNeedsDisconnect
                            ? 'banners.reconnectFirst'
                            : 'progress.issues.unavailable'
                          : 'banners.askOwner'
                      )}
                    </Text>
                  )}
                </BlockStack>
              </Box>
            )}
            {model.disconnect.result && view.state === 'disconnected' && (
              <Banner tone="info" title={t('disconnect.done')}>
                <BlockStack gap="200">
                  {model.disconnect.result.businessAppSteps.length > 0 && (
                    <>
                      <p>{t('disconnect.appStepsIntro')}</p>
                      <List type="number">
                        {model.disconnect.result.businessAppSteps.map(
                          (step) => (
                            <List.Item key={step}>
                              {t.has('disconnect.appSteps.' + step)
                                ? t('disconnect.appSteps.' + step)
                                : t('disconnect.cleanupManual')}
                            </List.Item>
                          )
                        )}
                      </List>
                    </>
                  )}
                  {model.disconnect.result.providerCleanup ===
                    'manual_required' && <p>{t('disconnect.cleanupManual')}</p>}
                </BlockStack>
              </Banner>
            )}
            <Box
              borderBlockStartWidth="025"
              borderColor="border"
              paddingBlockStart="400"
            >
              <InlineStack align="space-between" blockAlign="center" gap="300">
                {view.state !== 'disconnected' ? (
                  <InlineStack gap="300" blockAlign="center">
                    <Button
                      onClick={() => setConfirming(true)}
                      disabled={
                        !view.canDisconnect || model.disconnect.isPending
                      }
                    >
                      {t('disconnect.action')}
                    </Button>
                    {!view.canDisconnect && (
                      <Text as="span" tone="subdued" variant="bodySm">
                        {t('connect.ownerOnly')}
                      </Text>
                    )}
                  </InlineStack>
                ) : (
                  <span />
                )}
                <Link url={helpUrl} target="_blank" monochrome>
                  {t('help')}
                </Link>
              </InlineStack>
            </Box>
          </BlockStack>
          <Modal
            open={confirming}
            onClose={close}
            title={t('disconnect.title')}
            primaryAction={{
              content: t('disconnect.confirm'),
              destructive: true,
              loading: model.disconnect.isPending,
              onAction: async () => {
                if (await model.disconnect.run()) setConfirming(false)
              },
            }}
            secondaryActions={[
              {
                content: t('disconnect.keep'),
                disabled: model.disconnect.isPending,
                onAction: close,
              },
            ]}
          >
            <Modal.Section>
              <BlockStack gap="300">
                <Text as="p">
                  {t('disconnect.body')}
                  {view.signupPath === 'coexistence' && (
                    <> {t('disconnect.coexistence')}</>
                  )}
                </Text>
                <Text as="p" tone="subdued">
                  {t('disconnect.history')}
                </Text>
                {model.disconnect.error && (
                  <Banner tone="critical">
                    <p>
                      {model.disconnect.error === 'ownerRequired'
                        ? tErrors('ownerRequired')
                        : t('disconnect.error')}
                    </p>
                  </Banner>
                )}
              </BlockStack>
            </Modal.Section>
          </Modal>
        </>
      )}
    </Card>
  )
}

/** The status note as text; a component so the hook is never called conditionally. */
function NoteText({ note }: { note: WhatsappStatusNote }) {
  return <>{useStatusNoteText(note)}</>
}

function ProgressRow({
  row,
  isOwner,
  helpUrl,
  onReconnect,
}: {
  row: WhatsappProgressRow
  isOwner: boolean
  helpUrl: string
  onReconnect: () => void
}) {
  const t = useTranslations('whatsappConnect.tab.progress')
  const tone =
    row.tone === 'success'
      ? 'success'
      : row.tone === 'warning'
        ? 'attention'
        : row.tone === 'info'
          ? 'info'
          : undefined
  return (
    <li>
      <Box borderBlockStartWidth="025" borderColor="border" paddingBlock="400">
        <BlockStack gap="200">
          <InlineGrid
            columns="24px minmax(0, 1fr) auto"
            gap="300"
            alignItems="center"
          >
            <span aria-hidden="true">
              {row.done ? (
                <Icon source={CheckIcon} tone="success" />
              ) : row.issue ? (
                <Icon source={AlertCircleIcon} tone="caution" />
              ) : (
                <span
                  style={{
                    display: 'block',
                    width: 20,
                    height: 20,
                    border: '1px solid var(--p-color-border)',
                    borderRadius: '50%',
                  }}
                />
              )}
            </span>
            <Text as="span" variant="bodyMd" fontWeight="medium">
              {t('labels.' + row.id)}
            </Text>
            <Badge tone={tone}>{t('statuses.' + row.status)}</Badge>
          </InlineGrid>
          {row.issue && (
            <div style={{ paddingInlineStart: 36 }}>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">
                  {t('issues.' + row.issue)}
                </Text>
                {row.action === 'whatsapp_manager' && (
                  <Link
                    url="https://business.facebook.com/wa/manage/"
                    target="_blank"
                  >
                    {t('actions.manager')}
                  </Link>
                )}
                {row.action === 'support' && (
                  <Link url={helpUrl} target="_blank">
                    {t('actions.help')}
                  </Link>
                )}
                {row.action === 'reconnect' &&
                  (isOwner ? (
                    <Button variant="plain" onClick={onReconnect}>
                      {t('actions.reconnect')}
                    </Button>
                  ) : (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t('actions.askOwner')}
                    </Text>
                  ))}
              </BlockStack>
            </div>
          )}
        </BlockStack>
      </Box>
    </li>
  )
}

function ConnectAction({
  model,
  canConnect,
  label,
}: {
  model: WhatsappTabModel
  canConnect: boolean
  label: string
}) {
  const t = useTranslations('whatsappConnect')
  const { entry } = model
  return (
    <BlockStack gap="200">
      <InlineStack gap="300" blockAlign="center">
        <Button
          variant="primary"
          onClick={entry.open}
          disabled={!canConnect}
          loading={entry.status === 'opening'}
        >
          {label}
        </Button>
        {!canConnect && (
          <Text as="span" tone="subdued">
            {t('tab.connect.ownerOnly')}
          </Text>
        )}
      </InlineStack>
      {entry.status === 'opened' && (
        <Text as="p" tone="subdued">
          {t('tab.connect.opened')}
        </Text>
      )}
      {entry.status === 'blocked' && entry.pendingUrl && (
        <Banner tone="info">
          <p>
            {t('card.blocked')}{' '}
            <Link url={entry.pendingUrl} target="_blank">
              {t('card.openLink')}
            </Link>
          </p>
        </Banner>
      )}
      {entry.status === 'failed' && (
        <Banner tone="warning">
          <p>{t('errors.' + serverErrorKey(entry.errorCode))}</p>
        </Banner>
      )}
    </BlockStack>
  )
}
