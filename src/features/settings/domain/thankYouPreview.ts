import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  getMessageLanguageDirection,
  type MessageLanguage,
} from '@/shared/lib/messageLanguage'

export interface ThankYouMessagesProps {
  acknowledgment: SettingsResponse['acknowledgment']
  checked: boolean
  onChange: (checked: boolean) => void
  readOnly: boolean
  language: MessageLanguage
  style: string | null
  sample: { store: string; order: string }
  automaticStyle: boolean
}

export function thankYouPreview({
  acknowledgment,
  language,
  style,
  sample,
  automaticStyle,
}: ThankYouMessagesProps) {
  const texts = acknowledgment?.previews[language]
  const selected =
    texts?.[automaticStyle ? 'default' : (style ?? 'default')] ?? texts?.default
  const fill = (text: string | null | undefined) =>
    text?.replace(
      /{{\s*(store|order)\s*}}/gi,
      (_, key: string) => sample[key.toLowerCase() as 'store' | 'order']
    ) ?? null
  return {
    direction: getMessageLanguageDirection(language),
    confirmed: fill(selected?.confirmed),
    canceled: fill(selected?.canceled),
  }
}
