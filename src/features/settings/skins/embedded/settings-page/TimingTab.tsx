'use client'

import { useMemo } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  InlineStack,
  Layout,
  Select,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import { buildAutomationTimeline } from '@/features/settings/domain/automationTimeline'
import {
  ESCALATION_PRESET_HOURS,
  hourPresetOptions,
  REMINDER_PRESET_HOURS,
  sendDelayFieldsFor,
  sendDelayOptions,
} from '@/features/settings/domain/delayPresets'
import { quietTimeValues } from '@/features/settings/domain/quietHours'
import {
  resolvedSendDelayMinutes,
  SETTINGS_FIELD_ID,
  timelineInputFromForm,
} from '@/features/settings/domain/settingsForm'
import { buildTimezoneOptions } from '@/features/settings/domain/timezoneOptions'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import {
  formatQuietTime,
  formatShortDuration,
} from '@/features/settings/skins/shared/settingsFormatters'
import { AutomationTimelineCard } from './AutomationTimelineCard'
import { SegmentedButtons } from './SegmentedButtons'

interface TimingTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
  readOnly: boolean
  /** Opens the Message tab, where the message is previewed. */
  onPreviewMessage: () => void
}

export function TimingTab({
  model,
  data,
  readOnly,
  onPreviewMessage,
}: TimingTabProps) {
  const t = useTranslations('settings.embedded.timing')
  const tSettings = useTranslations('settings')
  const values = model.values
  const shopTimezone = data.state.shopTimezone ?? null

  const timezoneOptions = useMemo(
    () =>
      buildTimezoneOptions({
        shopTimezone,
        currentTimezone: values?.timezone,
        curatedLabel: (zone) =>
          tSettings(`automation.timezones.${zone.replaceAll('/', '_')}`),
        storeTimeLabel: (zone) => t('storeTime', { zone }),
      }),
    [shopTimezone, t, tSettings, values?.timezone]
  )

  if (!values) return null

  const timeline = buildAutomationTimeline(timelineInputFromForm(values))

  const sendDelayMinutes = resolvedSendDelayMinutes(values)
  const sendChoices = sendDelayOptions(sendDelayMinutes).map((option) => ({
    value: option.minutes,
    label:
      option.minutes === 0
        ? t('sendPresets.now')
        : formatShortDuration(t, option.minutes),
  }))

  const hourOptions = (presets: readonly number[], currentMinutes: number) =>
    hourPresetOptions(presets, currentMinutes).map((option) => ({
      value: option.minutes,
      label: t('hoursShort', { count: option.hours }),
    }))

  const timeOptions = quietTimeValues(
    values.quietHoursStart,
    values.quietHoursEnd
  ).map((value) => ({ value, label: formatQuietTime(t, value) }))

  const quietHoursError = model.errors.quietHours
    ? t(`quietErrors.${model.errors.quietHours}`)
    : undefined
  const timezoneError = model.errors.timezone
    ? t('quietErrors.unsupportedTimezone')
    : undefined

  return (
    <Layout>
      <Layout.Section>
        <AutomationTimelineCard timeline={timeline} />
      </Layout.Section>

      <Layout.AnnotatedSection
        id="settings-auto-confirm"
        title={t('autoHeading')}
        description={t('autoDescription')}
      >
        <Card>
          <BlockStack gap="400">
            <Checkbox
              label={t('autoLabel')}
              helpText={t('autoHelp')}
              checked={values.isAutoVerifyEnabled}
              disabled={readOnly}
              onChange={(checked) =>
                model.update({ isAutoVerifyEnabled: checked })
              }
            />
            {values.isAutoVerifyEnabled && (
              <Box paddingInlineStart="800">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" fontWeight="medium">
                      {t('sendTimeLabel')}
                    </Text>
                    <Button variant="plain" onClick={onPreviewMessage}>
                      {t('previewMessage')}
                    </Button>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <SegmentedButtons
                      label={t('sendTimeLabel')}
                      options={sendChoices}
                      value={sendDelayMinutes}
                      disabled={readOnly}
                      onChange={(minutes) =>
                        model.update(sendDelayFieldsFor(minutes))
                      }
                    />
                    <Text as="span" tone="subdued">
                      {t('fromOrder')}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.AnnotatedSection
        id="settings-follow-up"
        title={t('followHeading')}
        description={t('followDescription')}
      >
        <Card padding="0">
          <Box padding="400">
            <BlockStack gap="300">
              <Checkbox
                label={t('reminderLabel')}
                checked={values.followUpEnabled}
                disabled={readOnly}
                onChange={(checked) =>
                  model.update({ followUpEnabled: checked })
                }
              />
              {values.followUpEnabled && (
                <Box paddingInlineStart="800">
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span">{t('after')}</Text>
                      <SegmentedButtons
                        label={t('reminderGroup')}
                        options={hourOptions(
                          REMINDER_PRESET_HOURS,
                          values.followUpDelayMinutes
                        )}
                        value={values.followUpDelayMinutes}
                        disabled={readOnly}
                        onChange={(minutes) =>
                          model.update({ followUpDelayMinutes: minutes })
                        }
                      />
                      <Text as="span" tone="subdued">
                        {t('fromFirstMessage')}
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued">
                      {t('reminderCounts')}
                    </Text>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </Box>
          <Divider />
          <Box padding="400">
            <BlockStack gap="300">
              <Checkbox
                label={t('alertLabel')}
                helpText={t('alertHelp')}
                checked={values.escalationEnabled}
                disabled={readOnly}
                onChange={(checked) =>
                  model.update({ escalationEnabled: checked })
                }
              />
              {values.escalationEnabled && (
                <Box paddingInlineStart="800">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">{t('after')}</Text>
                    <SegmentedButtons
                      label={t('alertGroup')}
                      options={hourOptions(
                        ESCALATION_PRESET_HOURS,
                        values.escalationGapMinutes
                      )}
                      value={values.escalationGapMinutes}
                      disabled={readOnly}
                      onChange={(minutes) =>
                        model.update({ escalationGapMinutes: minutes })
                      }
                    />
                    <Text as="span" tone="subdued">
                      {values.followUpEnabled
                        ? t('fromReminder')
                        : t('fromFirstMessage')}
                    </Text>
                  </InlineStack>
                </Box>
              )}
            </BlockStack>
          </Box>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.AnnotatedSection
        id="settings-quiet-hours"
        title={t('quietHeading')}
        description={t('quietDescription')}
      >
        <Card>
          <BlockStack gap="400">
            <Checkbox
              label={t('quietLabel')}
              helpText={values.quietHoursEnabled ? undefined : t('quietOff')}
              checked={values.quietHoursEnabled}
              disabled={readOnly}
              onChange={model.setQuietHoursEnabled}
            />
            {values.quietHoursEnabled && (
              <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                <Select
                  id={SETTINGS_FIELD_ID.quietHours}
                  label={t('quietFrom')}
                  options={timeOptions}
                  value={values.quietHoursStart}
                  disabled={readOnly}
                  error={quietHoursError}
                  onChange={(value) => model.update({ quietHoursStart: value })}
                />
                <Select
                  label={t('quietTo')}
                  options={timeOptions}
                  value={values.quietHoursEnd}
                  disabled={readOnly}
                  error={Boolean(quietHoursError)}
                  onChange={(value) => model.update({ quietHoursEnd: value })}
                />
                <Select
                  id={SETTINGS_FIELD_ID.timezone}
                  label={t('timezoneLabel')}
                  options={timezoneOptions}
                  value={values.timezone}
                  disabled={readOnly}
                  error={timezoneError}
                  onChange={(value) => model.update({ timezone: value })}
                />
              </InlineGrid>
            )}
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>
    </Layout>
  )
}
