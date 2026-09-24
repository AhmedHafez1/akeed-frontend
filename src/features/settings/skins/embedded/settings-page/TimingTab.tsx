'use client'

import { useMemo } from 'react'
import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  InlineStack,
  Layout,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import { buildAutomationTimeline } from '@/features/settings/domain/automationTimeline'
import {
  ESCALATION_PRESET_HOURS,
  hourPresetOptions,
  REMINDER_PRESET_HOURS,
  SEND_DELAY_PRESETS,
  sendDelayPresetMinutes,
  type SendDelayChoice,
} from '@/features/settings/domain/delayPresets'
import { quietTimeValues } from '@/features/settings/domain/quietHours'
import {
  resolvedSendDelayMinutes,
  SETTINGS_FIELD_ID,
} from '@/features/settings/domain/settingsForm'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { AutomationTimelineCard } from './AutomationTimelineCard'
import { SegmentedButtons } from './SegmentedButtons'
import { formatQuietTime, timezonePlaceName } from './settingsFormatters'

/** The Shopify tag the no-reply alert adds (`shopify-outcome.adapter.ts`). */
const NO_REPLY_TAG = 'Akeed: No Reply'

const CURATED_TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Qatar',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Muscat',
  'Asia/Amman',
  'Africa/Cairo',
  'Africa/Casablanca',
  'UTC',
] as const

interface TimingTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

export function TimingTab({ model, data, readOnly }: TimingTabProps) {
  const t = useTranslations('settings.embedded.timing')
  const tSettings = useTranslations('settings')
  const values = model.values
  const shopTimezone = data.state.shopTimezone ?? null

  const timezoneOptions = useMemo(() => {
    const curatedLabel = (zone: string) =>
      (CURATED_TIMEZONES as readonly string[]).includes(zone)
        ? tSettings(`automation.timezones.${zone.replaceAll('/', '_')}`)
        : timezonePlaceName(zone)
    const options = CURATED_TIMEZONES.filter(
      (zone) => zone !== shopTimezone
    ).map((zone) => ({ value: zone as string, label: curatedLabel(zone) }))
    if (shopTimezone) {
      options.unshift({
        value: shopTimezone,
        label: t('storeTime', { zone: curatedLabel(shopTimezone) }),
      })
    }
    const current = values?.timezone
    if (current && !options.some((option) => option.value === current)) {
      options.push({ value: current, label: curatedLabel(current) })
    }
    return options
  }, [shopTimezone, t, tSettings, values?.timezone])

  if (!values) return null

  const timeline = buildAutomationTimeline({
    isAutoVerifyEnabled: values.isAutoVerifyEnabled,
    sendDelayMinutes: resolvedSendDelayMinutes(values),
    followUpEnabled: values.followUpEnabled,
    followUpDelayMinutes: values.followUpDelayMinutes,
    escalationEnabled: values.escalationEnabled,
    escalationGapMinutes: values.escalationGapMinutes,
    quietHoursEnabled: values.quietHoursEnabled,
    quietHoursStart: values.quietHoursStart,
    quietHoursEnd: values.quietHoursEnd,
  })

  const sendChoices: ReadonlyArray<{ value: SendDelayChoice; label: string }> =
    [
      ...SEND_DELAY_PRESETS.map((preset) => ({
        value: preset.id,
        label: t(`sendPresets.${preset.id}`),
      })),
      { value: 'custom', label: t('sendPresets.custom') },
    ]

  const handleSendChoice = (choice: SendDelayChoice) => {
    if (choice === 'custom') {
      const current = resolvedSendDelayMinutes(values)
      model.update({
        sendDelayChoice: 'custom',
        sendDelayCustom: String(current ?? 0),
      })
      return
    }
    model.update({
      sendDelayChoice: choice,
      sendDelayCustom: String(sendDelayPresetMinutes(choice)),
    })
  }

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
                  <Text as="p" fontWeight="medium">
                    {t('sendTimeLabel')}
                  </Text>
                  <SegmentedButtons
                    label={t('sendTimeLabel')}
                    options={sendChoices}
                    value={values.sendDelayChoice}
                    disabled={readOnly}
                    onChange={handleSendChoice}
                  />
                  {values.sendDelayChoice === 'custom' && (
                    <Box maxWidth="240px">
                      <TextField
                        id={SETTINGS_FIELD_ID.sendDelayCustom}
                        label={t('customDelayLabel')}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={1440}
                        step={1}
                        autoComplete="off"
                        suffix={t('customDelaySuffix')}
                        value={values.sendDelayCustom}
                        disabled={readOnly}
                        error={
                          model.errors.sendDelayCustom
                            ? t('customDelayError')
                            : undefined
                        }
                        onChange={(value) =>
                          model.update({ sendDelayCustom: value })
                        }
                      />
                    </Box>
                  )}
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t('sendTimeHelp')}
                  </Text>
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
                helpText={t('reminderHelp')}
                checked={values.followUpEnabled}
                disabled={readOnly}
                onChange={(checked) =>
                  model.update({ followUpEnabled: checked })
                }
              />
              {values.followUpEnabled && (
                <Box paddingInlineStart="800">
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
                </Box>
              )}
            </BlockStack>
          </Box>
          <Divider />
          <Box padding="400">
            <BlockStack gap="300">
              <Checkbox
                label={t('alertLabel')}
                helpText={t.rich('alertHelp', {
                  tag: () => (
                    <Text as="span" variant="bodySm" tone="subdued">
                      <code dir="ltr">{NO_REPLY_TAG}</code>
                    </Text>
                  ),
                })}
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
