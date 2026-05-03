import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  Icon,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import { QuestionCircleIcon, ShieldCheckMarkIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type { AutomationTimezone } from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'

function HelpIcon({ content }: { content: string }) {
  return (
    <span
      title={content}
      aria-label={content}
      className="inline-flex h-5 w-5 items-center justify-center text-[#8a8a8a]"
    >
      <Icon source={QuestionCircleIcon} tone="subdued" />
    </span>
  )
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <InlineStack gap="100" blockAlign="center">
      <Text as="span" variant="bodyMd">
        {label}
      </Text>
      {help ? <HelpIcon content={help} /> : null}
    </InlineStack>
  )
}

export function AutomationSettingsEmbeddedSkin(props: SettingsSkinProps) {
  const t = useTranslations('settings')

  return (
    <Page title={t('automation.title')} subtitle={t('automation.subtitle')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {props.errorBanner && (
              <Banner tone="critical">
                <p>{props.errorBanner}</p>
              </Banner>
            )}

            {props.successBanner && (
              <Banner tone="success">
                <p>{props.successBanner}</p>
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="start" gap="400">
                  <BlockStack gap="150">
                    <InlineStack gap="150" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        {t('automation.heading')}
                      </Text>
                      <HelpIcon content={t('automation.description')} />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ShieldCheckMarkIcon} tone="success" />
                      <Text as="p" tone="subdued" variant="bodySm">
                        {t('automation.trustSignal')}
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <Button
                    variant="primary"
                    loading={props.isSaving}
                    onClick={() => void props.onSave()}
                  >
                    {props.isSaving ? t('savingButton') : t('saveButton')}
                  </Button>
                </InlineStack>

                <Divider />

                <Checkbox
                  label={
                    <InlineStack gap="100" blockAlign="center">
                      <Text as="span">{t('autoVerifyLabel')}</Text>
                      <HelpIcon content={t('autoVerifyDescription')} />
                    </InlineStack>
                  }
                  checked={props.isAutoVerifyEnabled}
                  onChange={props.onAutoVerifyChange}
                />

                <BlockStack gap="100">
                  <FieldLabel
                    label={t('automation.sendDelayMinutesLabel')}
                    help={t('automation.sendDelayMinutesHelp')}
                  />
                  <TextField
                    label={t('automation.sendDelayMinutesLabel')}
                    labelHidden
                    type="number"
                    autoComplete="off"
                    min={0}
                    max={720}
                    step={0.25}
                    value={props.sendDelayMinutes}
                    onChange={props.onSendDelayMinutesChange}
                    error={props.sendDelayMinutesError}
                  />
                </BlockStack>

                <Divider />

                <Checkbox
                  label={
                    <InlineStack gap="100" blockAlign="center">
                      <Text as="span">
                        {t('automation.followUpEnabledLabel')}
                      </Text>
                      <HelpIcon content={t('automation.followUpEnabledHelp')} />
                    </InlineStack>
                  }
                  checked={props.followUpEnabled}
                  onChange={props.onFollowUpEnabledChange}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <BlockStack gap="100">
                    <TextField
                      label={t('automation.followUpDelayMinutesLabel')}
                      type="number"
                      autoComplete="off"
                      min={0}
                      max={720}
                      step={0.25}
                      value={props.followUpDelayMinutes}
                      onChange={props.onFollowUpDelayMinutesChange}
                      error={props.followUpDelayMinutesError}
                      disabled={!props.followUpEnabled}
                    />
                  </BlockStack>
                  <BlockStack gap="100">
                    <FieldLabel
                      label={t('automation.escalationDelayMinutesLabel')}
                      help={t('automation.escalationDelayMinutesHelp')}
                    />
                    <TextField
                      label={t('automation.escalationDelayMinutesLabel')}
                      labelHidden
                      type="number"
                      autoComplete="off"
                      min={0}
                      max={720}
                      step={0.25}
                      value={props.escalationDelayMinutes}
                      onChange={props.onEscalationDelayMinutesChange}
                      error={props.escalationDelayMinutesError}
                    />
                    <Text as="p" tone="subdued" variant="bodySm">
                      {props.escalationReviewDescription}
                    </Text>
                  </BlockStack>
                </div>

                <Divider />

                <Checkbox
                  label={
                    <InlineStack gap="100" blockAlign="center">
                      <Text as="span">
                        {t('automation.quietHoursEnabledLabel')}
                      </Text>
                      <HelpIcon
                        content={t('automation.quietHoursEnabledHelp')}
                      />
                    </InlineStack>
                  }
                  checked={props.quietHoursEnabled}
                  onChange={props.onQuietHoursEnabledChange}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <TextField
                    label={t('automation.quietHoursStartLabel')}
                    type="time"
                    autoComplete="off"
                    value={props.quietHoursStart}
                    onChange={props.onQuietHoursStartChange}
                    disabled={!props.quietHoursEnabled}
                    error={props.quietHoursError}
                  />
                  <TextField
                    label={t('automation.quietHoursEndLabel')}
                    type="time"
                    autoComplete="off"
                    value={props.quietHoursEnd}
                    onChange={props.onQuietHoursEndChange}
                    disabled={!props.quietHoursEnabled}
                  />
                  <Select
                    label={t('automation.timezoneLabel')}
                    options={[...props.timezoneOptions]}
                    value={props.timezone}
                    onChange={(value) =>
                      props.onTimezoneChange(value as AutomationTimezone)
                    }
                  />
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
