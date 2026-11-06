'use client'

import { useState, type ReactNode } from 'react'
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  DataTable,
  Divider,
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
import { ChatIcon, CheckIcon } from '@shopify/polaris-icons'
import { useLocale, useTranslations } from 'next-intl'
import {
  acceptedAtLabel,
  messageLanguageName,
  serverErrorKey,
  useWhatsappTab,
  type AcceptedSend,
  type ConnectionView,
  type TabBanner,
  type TemplateRow,
  type WhatsappTabModel,
} from '@/features/whatsapp-connect'
import type { UsagePools } from '@/shared/types/usagePools'
import { formatMessageCount } from '@/features/billing'
import { buildDocsArticleHref } from '@/shared/lib/docs-links'
import { getFormatLocale, resolveSupportedLocale } from '@/shared/lib/locale'

type BadgeTone = 'success' | 'info' | 'critical' | 'warning' | 'attention'

const CONNECTION_TONE: Record<ConnectionView['badge'], BadgeTone> = {
  connected: 'success',
  preparing: 'info',
  disconnected: 'critical',
}

const STATUS_TONE: Record<TemplateRow['status'], BadgeTone | undefined> = {
  approved: 'success',
  pending: 'attention',
  rejected: 'critical',
  paused: 'warning',
  recategorized: 'warning',
  missing: undefined,
}

/**
 * The merchant's own WhatsApp number inside Shopify Admin: the same facts
 * and actions as the standalone tab, in Polaris. The Akeed and own-number
 * pools come from the plan the settings page already loaded.
 */
export function WhatsappTab({ pools }: { pools: UsagePools | null }) {
  const t = useTranslations('whatsappConnect.tab')
  const model = useWhatsappTab()
  const locale = resolveSupportedLocale(useLocale())

  if (model.status === 'loading') {
    return (
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={4} />
        </BlockStack>
      </Card>
    )
  }
  if (model.status === 'error') {
    return (
      <Banner
        tone="critical"
        title={t('load.title')}
        action={{ content: t('load.retry'), onAction: model.retry }}
      >
        <p>{t('load.body')}</p>
      </Banner>
    )
  }
  const view = model.view
  if (view.kind === 'hidden') return null

  return (
    <BlockStack gap="400">
      {view.kind === 'connection' &&
        view.banners.map((banner) => (
          <TabBannerView key={banner.key} banner={banner} view={view} />
        ))}
      <BlockStack gap="500">
        <AnnotatedSection
          title={t('number.title')}
          description={t('number.description')}
        >
          {view.kind === 'unconnected' ? (
            <ConnectCard model={model} canConnect={view.canConnect} />
          ) : (
            <NumberCard view={view} model={model} />
          )}
        </AnnotatedSection>
        {view.kind === 'unconnected' && pools && (
          <AnnotatedSection
            title={t('costs.title')}
            description={t('costs.description')}
          >
            <Card>
              <BlockStack gap="300">
                <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                  <Fact label={t('costs.fromAkeed')}>
                    {t('costs.messages', {
                      count: formatMessageCount(pools.akeed.limit),
                    })}
                  </Fact>
                  <Fact label={t('costs.fromYours')}>
                    {t('costs.extraMessages', {
                      count: formatMessageCount(pools.ownNumber.limit),
                    })}
                  </Fact>
                </InlineGrid>
                <Text as="p" tone="subdued">
                  {t('costs.poolNote')}
                </Text>
              </BlockStack>
            </Card>
          </AnnotatedSection>
        )}
        {view.kind === 'connection' && view.state !== 'disconnected' && (
          <>
            <AnnotatedSection
              title={t('templates.title')}
              description={t('templates.description')}
            >
              <TemplatesCard view={view} locale={locale} />
            </AnnotatedSection>
            <AnnotatedSection
              title={t('thankYou.title')}
              description={t('thankYou.description')}
            >
              <Card>
                <BlockStack gap="200">
                  <Checkbox
                    label={t('thankYou.heading')}
                    helpText={t('thankYou.help')}
                    checked={view.thankYou.enabled}
                    disabled={
                      !view.thankYou.canUpdate || model.thankYou.isSaving
                    }
                    onChange={model.thankYou.set}
                  />
                  {!view.thankYou.canUpdate && (
                    <Text as="p" tone="subdued">
                      {t('thankYou.readOnly')}
                    </Text>
                  )}
                  {model.thankYou.error && (
                    <Banner tone="critical">
                      <p>
                        {model.thankYou.error === 'writeRequired'
                          ? t('thankYou.readOnly')
                          : t('thankYou.error')}
                      </p>
                    </Banner>
                  )}
                </BlockStack>
              </Card>
            </AnnotatedSection>
          </>
        )}
      </BlockStack>
      <Text as="p" tone="subdued">
        <Link
          url={buildDocsArticleHref({ locale, article: 'ownWhatsappNumber' })}
          target="_blank"
        >
          {t('help')}
        </Link>
      </Text>
    </BlockStack>
  )
}

/**
 * Polaris's annotated layout, rebuilt on InlineGrid: `Layout` offsets its
 * sections with physical left margins, which push the page sideways in
 * Arabic and Urdu.
 */
function AnnotatedSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <InlineGrid columns={{ xs: 1, md: ['oneThird', 'twoThirds'] }} gap="400">
      {/* Cards go edge to edge on phones; the heading keeps its inset. */}
      <Box paddingInline={{ xs: '400', sm: '0' }}>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          <Text as="p" tone="subdued">
            {description}
          </Text>
        </BlockStack>
      </Box>
      <div className="min-w-0">{children}</div>
    </InlineGrid>
  )
}

type LineState = 'idle' | 'waiting' | 'connected' | 'disconnected'

/**
 * Akeed on one end and the merchant's number on the other, drawn with
 * Polaris tokens so it reads as part of the Admin page. What it says is read
 * out once, as a sentence.
 */
function NumberLine({
  state,
  phone,
}: {
  state: LineState
  phone: string | null
}) {
  const t = useTranslations('whatsappConnect.tab')
  const shown = phone ?? t('number.yourNumber')
  const linked = state === 'connected'
  return (
    <div>
      <span className="sr-only">{t(`line.${state}`, { number: shown })}</span>
      <div aria-hidden="true" className="flex items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: 'var(--p-color-bg-fill-brand)',
            color: 'var(--p-color-text-brand-on-bg-fill)',
          }}
        >
          <Icon source={CheckIcon} />
        </span>
        <span
          className="block h-0 min-w-8 flex-1 sm:max-w-60"
          style={{
            borderTop: `2px ${linked ? 'solid' : 'dashed'} ${
              linked
                ? 'var(--p-color-border-success)'
                : 'var(--p-color-border-secondary)'
            }`,
          }}
        />
        <span
          className="flex min-w-0 items-center gap-1.5 rounded-lg px-3 py-1.5"
          style={{
            border: `1px ${state === 'idle' ? 'dashed' : 'solid'} ${
              linked ? 'var(--p-color-border-success)' : 'var(--p-color-border)'
            }`,
            background: linked
              ? 'var(--p-color-bg-surface-success)'
              : 'var(--p-color-bg-surface)',
          }}
        >
          <Icon source={ChatIcon} tone={linked ? 'success' : 'subdued'} />
          <Text
            as="span"
            fontWeight="semibold"
            tone={linked ? 'success' : 'subdued'}
          >
            {phone ? <bdi dir="ltr">{phone}</bdi> : shown}
          </Text>
        </span>
      </div>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <BlockStack gap="100">
      <Text as="p" tone="subdued">
        {label}
      </Text>
      <Text as="p" fontWeight="semibold">
        {children}
      </Text>
    </BlockStack>
  )
}

function ConnectCard({
  model,
  canConnect,
}: {
  model: WhatsappTabModel
  canConnect: boolean
}) {
  const t = useTranslations('whatsappConnect.tab')
  return (
    <Card>
      <BlockStack gap="400">
        <NumberLine state="idle" phone={null} />
        <BlockStack gap="100">
          <Text as="h3" variant="headingSm">
            {t('connect.heading')}
          </Text>
          <Text as="p" tone="subdued">
            {t('connect.body')}
          </Text>
        </BlockStack>
        <List type="bullet">
          <List.Item>{t('connect.keepApp')}</List.Item>
          <List.Item>{t('connect.metaBills')}</List.Item>
        </List>
        <Divider />
        <ConnectAction
          model={model}
          canConnect={canConnect}
          label={t('connect.action')}
          hint={canConnect ? t('connect.hint') : t('connect.ownerOnly')}
        />
        {!canConnect && (
          <Banner tone="info" title={t('permissions.title')}>
            <p>{t('permissions.body')}</p>
          </Banner>
        )}
      </BlockStack>
    </Card>
  )
}

function ConnectAction({
  model,
  canConnect,
  label,
  hint,
}: {
  model: WhatsappTabModel
  canConnect: boolean
  label: string
  hint: string
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
        <Text as="span" tone="subdued">
          {hint}
        </Text>
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
          <p>{t(`errors.${serverErrorKey(entry.errorCode)}`)}</p>
        </Banner>
      )}
    </BlockStack>
  )
}

function NumberCard({
  view,
  model,
}: {
  view: ConnectionView
  model: WhatsappTabModel
}) {
  const t = useTranslations('whatsappConnect.tab')
  const tErrors = useTranslations('whatsappConnect.errors')
  const [confirming, setConfirming] = useState(false)
  const result = model.disconnect.result

  return (
    <Card>
      <BlockStack gap="400">
        <NumberLine
          state={
            view.badge === 'connected'
              ? 'connected'
              : view.badge === 'preparing'
                ? 'waiting'
                : 'disconnected'
          }
          phone={view.phone}
        />
        <InlineStack align="space-between" blockAlign="start" gap="300">
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              {view.phone ? (
                <bdi dir="ltr">{view.phone}</bdi>
              ) : (
                t('number.noNumber')
              )}
            </Text>
            <Text as="p" tone="subdued">
              {t(`number.subtitle.${view.signupPath}`)}
            </Text>
          </BlockStack>
          <Badge tone={CONNECTION_TONE[view.badge]}>
            {t(`status.${view.badge}`)}
          </Badge>
        </InlineStack>
        <Divider />
        {view.canReconnect ? (
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              {t('reconnect.title')}
            </Text>
            <Text as="p" tone="subdued">
              {t('reconnect.body')}
            </Text>
            <Fact label={t('reconnect.next')}>{t('reconnect.nextValue')}</Fact>
            <ConnectAction
              model={model}
              canConnect
              label={t('reconnect.action')}
              hint={t('connect.hint')}
            />
          </BlockStack>
        ) : (
          <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
            <Fact label={t('readiness.label')}>
              {t(`readiness.${view.readiness}`)}
            </Fact>
            <BlockStack gap="100">
              <Text as="p" tone="subdued">
                {t('last.confirmation')}
              </Text>
              <Text as="p" fontWeight="semibold">
                {view.lastConfirmation ? (
                  <LastSend send={view.lastConfirmation} />
                ) : (
                  t('last.noConfirmation')
                )}
              </Text>
              {view.lastReminder && (
                <Text as="p" tone="subdued">
                  {t('last.reminder')}: <LastSend send={view.lastReminder} />
                </Text>
              )}
              {(view.lastConfirmation || view.lastReminder) && (
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('last.historical')}
                </Text>
              )}
            </BlockStack>
          </InlineGrid>
        )}
        {result && view.state === 'disconnected' && (
          <Banner tone="warning" title={t('disconnect.done')}>
            <BlockStack gap="200">
              {result.businessAppSteps.length > 0 && (
                <>
                  <p>{t('disconnect.appStepsIntro')}</p>
                  <List type="number">
                    {result.businessAppSteps.map((step) => (
                      <List.Item key={step}>
                        {t.has(`disconnect.appSteps.${step}`)
                          ? t(`disconnect.appSteps.${step}`)
                          : step}
                      </List.Item>
                    ))}
                  </List>
                </>
              )}
              {result.providerCleanup === 'manual_required' && (
                <p>{t('disconnect.cleanupManual')}</p>
              )}
            </BlockStack>
          </Banner>
        )}
        {view.state !== 'disconnected' && (
          <>
            <Divider />
            <InlineStack gap="300" blockAlign="center">
              <Button
                onClick={() => setConfirming(true)}
                disabled={!view.canDisconnect}
              >
                {t('disconnect.action')}
              </Button>
              <Text as="span" tone="subdued">
                {t('connect.ownerOnly')}
              </Text>
            </InlineStack>
          </>
        )}
      </BlockStack>
      <Modal
        open={confirming}
        onClose={() => {
          if (model.disconnect.isPending) return
          setConfirming(false)
          model.disconnect.clearError()
        }}
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
            onAction: () => {
              setConfirming(false)
              model.disconnect.clearError()
            },
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
            <Banner tone="warning">
              <p>{t('disconnect.history')}</p>
            </Banner>
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
    </Card>
  )
}

function LastSend({ send }: { send: AcceptedSend }) {
  const t = useTranslations('whatsappConnect.tab')
  const formatLocale = getFormatLocale(useLocale())
  const sender =
    send.kind === 'merchant_own' ? t('sender.yourNumber') : t('sender.akeed')
  const delivery =
    send.deliveryStatus === 'accepted'
      ? ''
      : ` · ${t(`last.delivery.${send.deliveryStatus}`)}`
  return (
    <>
      {t('last.value', { sender, time: acceptedAtLabel(send, formatLocale) })}
      {delivery}
    </>
  )
}

function TemplatesCard({
  view,
  locale,
}: {
  view: ConnectionView
  locale: ReturnType<typeof resolveSupportedLocale>
}) {
  const t = useTranslations('whatsappConnect.tab')
  const rows = view.templates
  const approved = rows.filter((row) => row.status === 'approved').length
  const allApproved = rows.length > 0 && approved === rows.length
  const footer =
    view.readiness === 'ready'
      ? 'ready'
      : view.readiness.startsWith('degraded') && allApproved
        ? 'degraded'
        : rows.some((row) => row.status === 'pending')
          ? 'pending'
          : 'akeed'

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start" gap="300">
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              {t('templates.title')}
            </Text>
            <Text as="p" tone="subdued">
              {t('templates.subheading')}
            </Text>
          </BlockStack>
          {rows.length > 0 && (
            <Badge tone={allApproved ? 'success' : 'attention'}>
              {t('templates.approvedCount', {
                approved,
                total: rows.length,
              })}
            </Badge>
          )}
        </InlineStack>
        {rows.length === 0 ? (
          <Text as="p" tone="subdued">
            {t('templates.empty')}
          </Text>
        ) : (
          <Box>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={[
                t('templates.columns.language'),
                t('templates.columns.message'),
                t('templates.columns.status'),
                t('templates.columns.sender'),
              ]}
              rows={rows.map((row) => {
                const extraReason =
                  row.reason && !row.reason.startsWith('template')
                    ? ` · ${t(`templates.reason.${row.reason}`)}`
                    : ''
                return [
                  messageLanguageName(row.language, locale),
                  t(`templates.message.${row.message}`),
                  <Badge key="status" tone={STATUS_TONE[row.status]}>
                    {t(`templates.status.${row.status}`)}
                  </Badge>,
                  `${t(`sender.${row.sender}`)}${extraReason}`,
                ]
              })}
            />
          </Box>
        )}
        {rows.length > 0 && (
          <Text as="p" tone="subdued">
            {t(`templates.footer.${footer}`)}
          </Text>
        )}
      </BlockStack>
    </Card>
  )
}

const BANNER_TONE = {
  critical: 'warning',
  warning: 'warning',
  info: 'info',
} as const

function TabBannerView({
  banner,
  view,
}: {
  banner: TabBanner
  view: ConnectionView
}) {
  const t = useTranslations('whatsappConnect.tab')
  const locale = resolveSupportedLocale(useLocale())
  const templates = banner.templates
    .map((template) =>
      t('banners.templateItem', {
        language: messageLanguageName(template.language, locale),
        message: t(`templates.message.${template.message}`),
      })
    )
    .join(t('banners.templateSeparator'))
  return (
    <Banner
      tone={BANNER_TONE[banner.tone]}
      title={t(`banners.${banner.key}.title`)}
    >
      <BlockStack gap="100">
        <p>
          {t(`banners.${banner.key}.body`, { templates })}
          {banner.resumes && <> {t('banners.resumes')}</>}
        </p>
        {banner.action === 'reconnect' && !view.canReconnect && (
          <p>
            {view.isOwner ? t('banners.reconnectFirst') : t('banners.askOwner')}
          </p>
        )}
      </BlockStack>
    </Banner>
  )
}
