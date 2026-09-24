import type {
  ArabicCodTemplateVariantId,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
  OnboardingSettingsPayload,
} from '@/features/onboarding'
import type { SettingsResponse } from '../api/settingsApi'
import {
  escalationGapFromStored,
  escalationStoredFromGap,
  parseCustomDelayMinutes,
  sendDelayChoiceFor,
  sendDelayPresetMinutes,
  type SendDelayChoice,
} from './delayPresets'
import { validateQuietHours, type QuietHoursError } from './quietHours'
import type { SettingsTabId } from './settingsTabs'

/** Mirrors the backend limit: a template variable on every message. */
export const STORE_NAME_MAX_LENGTH = 60

const DEFAULT_QUIET_START = '21:00'
const DEFAULT_QUIET_END = '09:00'
/** The column default; a store still on it never chose a zone. */
const DEFAULT_TIMEZONE = 'Asia/Riyadh'

/**
 * Everything the Message and Timing tabs edit, in the shape the controls use.
 * Delays are whole minutes; the no-reply delay is the gap the tab shows (see
 * `delayPresets.ts`), converted back when the payload is built.
 */
export interface SettingsFormValues {
  storeName: string
  defaultLanguage: IntegrationOnboardingLanguage
  codTemplateVariants: {
    ar: ArabicCodTemplateVariantId
    en: EnglishCodTemplateVariantId
  }
  isAutoVerifyEnabled: boolean
  sendDelayChoice: SendDelayChoice
  sendDelayCustom: string
  followUpEnabled: boolean
  followUpDelayMinutes: number
  escalationEnabled: boolean
  escalationGapMinutes: number
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
  /** Not shown in the embedded app; sent back unchanged. */
  assumeCodWhenPaymentMissing: boolean
}

export function formFromSettings(
  state: IntegrationOnboardingState,
  template: SettingsResponse['template']
): SettingsFormValues {
  return {
    storeName: state.storeName ?? '',
    defaultLanguage: state.defaultLanguage,
    codTemplateVariants: { ...template.selected },
    isAutoVerifyEnabled: state.isAutoVerifyEnabled,
    sendDelayChoice: sendDelayChoiceFor(state.sendDelayMinutes),
    sendDelayCustom: String(state.sendDelayMinutes),
    followUpEnabled: state.followUpEnabled,
    followUpDelayMinutes: state.followUpDelayMinutes,
    escalationEnabled: state.escalationEnabled,
    escalationGapMinutes: escalationGapFromStored({
      escalationDelayMinutes: state.escalationDelayMinutes,
      followUpEnabled: state.followUpEnabled,
      followUpDelayMinutes: state.followUpDelayMinutes,
    }),
    quietHoursEnabled: state.quietHoursEnabled,
    quietHoursStart: state.quietHoursStart ?? DEFAULT_QUIET_START,
    quietHoursEnd: state.quietHoursEnd ?? DEFAULT_QUIET_END,
    timezone: state.timezone,
    assumeCodWhenPaymentMissing: state.assumeCodWhenPaymentMissing,
  }
}

/** The first-send delay the form currently means; null while invalid. */
export function resolvedSendDelayMinutes(
  values: SettingsFormValues
): number | null {
  return values.sendDelayChoice === 'custom'
    ? parseCustomDelayMinutes(values.sendDelayCustom)
    : sendDelayPresetMinutes(values.sendDelayChoice)
}

/**
 * The PATCH body. Every automation field is sent, including those under a
 * checkbox that is off, so turning one back on restores the same values.
 */
export function toSettingsPayload(
  values: SettingsFormValues
): OnboardingSettingsPayload {
  return {
    storeName: values.storeName.trim(),
    defaultLanguage: values.defaultLanguage,
    isAutoVerifyEnabled: values.isAutoVerifyEnabled,
    assumeCodWhenPaymentMissing: values.assumeCodWhenPaymentMissing,
    codTemplateArVariant: values.codTemplateVariants.ar,
    codTemplateEnVariant: values.codTemplateVariants.en,
    sendDelayMinutes: resolvedSendDelayMinutes(values) ?? undefined,
    followUpEnabled: values.followUpEnabled,
    followUpDelayMinutes: values.followUpDelayMinutes,
    escalationEnabled: values.escalationEnabled,
    escalationDelayMinutes: escalationStoredFromGap({
      gapMinutes: values.escalationGapMinutes,
      followUpEnabled: values.followUpEnabled,
      followUpDelayMinutes: values.followUpDelayMinutes,
    }),
    quietHoursEnabled: values.quietHoursEnabled,
    quietHoursStart: values.quietHoursStart,
    quietHoursEnd: values.quietHoursEnd,
    timezone: values.timezone,
  }
}

const MESSAGE_TAB_FIELDS = [
  'storeName',
  'defaultLanguage',
  'codTemplateArVariant',
  'codTemplateEnVariant',
] as const satisfies ReadonlyArray<keyof OnboardingSettingsPayload>

/**
 * Which editable tabs differ from the saved values. Compared on the payload,
 * so a UI-only change (for example opening "custom" on the same delay) is not
 * an unsaved change, while an invalid custom value is.
 */
export function dirtyTabs(
  current: SettingsFormValues,
  saved: SettingsFormValues
): Set<Exclude<SettingsTabId, 'plan'>> {
  const next = toSettingsPayload(current)
  const base = toSettingsPayload(saved)
  const tabs = new Set<Exclude<SettingsTabId, 'plan'>>()
  const keys = new Set([...Object.keys(next), ...Object.keys(base)]) as Set<
    keyof OnboardingSettingsPayload
  >
  // An unparsable custom value drops out of the payload; count it as a change.
  if (resolvedSendDelayMinutes(current) === null) tabs.add('timing')
  for (const key of keys) {
    if (next[key] === base[key]) continue
    tabs.add(
      (MESSAGE_TAB_FIELDS as readonly string[]).includes(key)
        ? 'message'
        : 'timing'
    )
  }
  return tabs
}

export type SettingsFieldKey =
  | 'storeName'
  | 'sendDelayCustom'
  | 'quietHours'
  | 'timezone'

export type SettingsFieldErrorCode =
  | 'required'
  | 'tooLong'
  | 'invalidDelay'
  | QuietHoursError
  | 'unsupportedTimezone'

export type SettingsFormErrors = Partial<
  Record<SettingsFieldKey, SettingsFieldErrorCode>
>

/** Order used to pick the first invalid field to focus after a failed save. */
export const SETTINGS_FIELD_ORDER: readonly SettingsFieldKey[] = [
  'storeName',
  'sendDelayCustom',
  'quietHours',
  'timezone',
]

export const SETTINGS_FIELD_TAB: Record<
  SettingsFieldKey,
  Exclude<SettingsTabId, 'plan'>
> = {
  storeName: 'message',
  sendDelayCustom: 'timing',
  quietHours: 'timing',
  timezone: 'timing',
}

/** DOM ids of the inputs, so a failed save can move focus to the field. */
export const SETTINGS_FIELD_ID: Record<SettingsFieldKey, string> = {
  storeName: 'settings-store-name',
  sendDelayCustom: 'settings-send-delay-custom',
  quietHours: 'settings-quiet-hours-start',
  timezone: 'settings-quiet-hours-timezone',
}

export function validateSettingsForm(
  values: SettingsFormValues
): SettingsFormErrors {
  const errors: SettingsFormErrors = {}
  const storeName = values.storeName.trim()
  if (!storeName) errors.storeName = 'required'
  else if (storeName.length > STORE_NAME_MAX_LENGTH)
    errors.storeName = 'tooLong'

  if (values.isAutoVerifyEnabled && resolvedSendDelayMinutes(values) === null) {
    errors.sendDelayCustom = 'invalidDelay'
  }

  const quietHoursError = validateQuietHours({
    enabled: values.quietHoursEnabled,
    start: values.quietHoursStart,
    end: values.quietHoursEnd,
  })
  if (quietHoursError) errors.quietHours = quietHoursError
  return errors
}

export function firstInvalidField(
  errors: SettingsFormErrors
): SettingsFieldKey | null {
  return SETTINGS_FIELD_ORDER.find((key) => errors[key]) ?? null
}

/** Maps a server rejection's stable code to the field it concerns. */
export function fieldErrorFromApiCode(
  code: string | undefined
): SettingsFormErrors | null {
  switch (code) {
    case 'SETTINGS_TIMEZONE_UNSUPPORTED':
      return { timezone: 'unsupportedTimezone' }
    case 'SETTINGS_QUIET_HOURS_EMPTY_WINDOW':
      return { quietHours: 'sameStartEnd' }
    default:
      return null
  }
}

/**
 * When a store that never chose a zone turns quiet hours on, start from the
 * Shopify store's own zone rather than the Riyadh column default. The change
 * is part of the form, so the merchant sees it before saving.
 */
export function suggestedTimezoneOnEnable(params: {
  saved: SettingsFormValues
  current: SettingsFormValues
  shopTimezone: string | null | undefined
}): string | null {
  const { saved, current, shopTimezone } = params
  if (!shopTimezone || saved.quietHoursEnabled) return null
  if (saved.timezone !== DEFAULT_TIMEZONE) return null
  if (current.timezone !== saved.timezone) return null
  return shopTimezone === current.timezone ? null : shopTimezone
}
