'use client'

import { useTranslations } from 'next-intl'
import {
  buildPreviewLines,
  isLtrVariable,
  type PreviewSample,
  type PreviewSegment,
} from '@/features/settings/domain/messagePreview'
import {
  getMessagePreviewTimestamp,
  type MessageLanguage,
} from '@/shared/lib/messageLanguage'
import {
  templateReplyTone,
  type TemplateMessage,
} from '@/shared/lib/templateMessage'
import { WhatsAppPhonePreview } from '@/shared/ui/whatsapp'

interface SettingsPhonePreviewProps {
  language: MessageLanguage
  message: TemplateMessage
  sample: PreviewSample
  /** What the picture shows, for assistive tech. */
  label: string
  /** Shown in the bubble when the message has no text. */
  emptyLabel: string
  /** The store's banner, shown as the message's image header. */
  headerImage?: { src: string; alt: string }
}

function PreviewSegmentText({ segment }: { segment: PreviewSegment }) {
  const text =
    segment.kind === 'variable' && isLtrVariable(segment.variable) ? (
      <bdi dir="ltr">{segment.text}</bdi>
    ) : (
      segment.text
    )
  return segment.bold ? <b className="font-bold">{text}</b> : text
}

/**
 * The confirmation message on a phone, as the customer sees it in WhatsApp:
 * bold where the message is bold, the total written as it is sent, and the
 * two quick replies. One picture to assistive tech. Both skins render it.
 */
export function SettingsPhonePreview({
  language,
  message,
  sample,
  label,
  emptyLabel,
  headerImage,
}: SettingsPhonePreviewProps) {
  const t = useTranslations('onboarding.test.phone')
  const lines = buildPreviewLines(message, sample)

  return (
    <div role="img" aria-label={label}>
      <WhatsAppPhonePreview
        senderName={t('senderName')}
        senderStatus={t('senderStatus')}
        avatarAlt=""
        dayLabel={t('today')}
        paragraphs={
          lines.length === 0
            ? [
                <span key="empty" className="opacity-70">
                  {emptyLabel}
                </span>,
              ]
            : lines.map((segments, index) => (
                <span key={index}>
                  {segments.map((segment, segmentIndex) => (
                    <PreviewSegmentText key={segmentIndex} segment={segment} />
                  ))}
                </span>
              ))
        }
        timeLabel={getMessagePreviewTimestamp(language)}
        buttons={message.buttons.map((reply, index) => ({
          label: reply,
          tone: templateReplyTone(index),
        }))}
        messageDir={message.direction}
        messageLang={language}
        headerImage={headerImage}
      />
    </div>
  )
}
