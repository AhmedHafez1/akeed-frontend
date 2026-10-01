import { Fragment } from 'react'
import { Check } from 'lucide-react'
import type { MessageTemplatePreview } from '@/features/settings/api/settingsApi'
import {
  buildPreviewLines,
  isLtrVariable,
  type PreviewSample,
} from '@/features/settings/domain/messagePreview'
import { formatTemplatePreviewTimestamp } from '@/features/settings/skins/shared/templatePreview'

interface WhatsAppMessagePreviewProps {
  language: 'ar' | 'en'
  template: MessageTemplatePreview
  sample: PreviewSample
  /** What the picture shows, for assistive tech. */
  label: string
  businessAccountLabel: string
}

/**
 * The confirmation message as the customer sees it in WhatsApp: the sender,
 * the bubble with its variables in bold, and the two quick replies. One
 * picture to assistive tech; order numbers and totals stay left to right
 * inside Arabic text.
 */
export function WhatsAppMessagePreview({
  language,
  template,
  sample,
  label,
  businessAccountLabel,
}: WhatsAppMessagePreviewProps) {
  const lines = buildPreviewLines(template, sample)

  return (
    <div
      role="img"
      aria-label={label}
      className="border-line rounded-ak-card overflow-hidden border"
    >
      <div className="border-line bg-surface-raised flex items-center gap-2.5 border-b px-3.5 py-2.5">
        <span className="bg-mint text-mint-foreground grid size-7.5 shrink-0 place-items-center rounded-full">
          <Check aria-hidden="true" strokeWidth={2.5} className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <bdi className="text-ak-caption text-ink font-bold">Akeed</bdi>
          <span className="text-ak-label text-ink-muted font-normal">
            {businessAccountLabel}
          </span>
        </span>
      </div>
      <div
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        lang={language}
        className="bg-surface-sunken bg-[radial-gradient(var(--line)_1px,transparent_1px)] bg-size-[14px_14px] px-3.5 pt-4.5 pb-5"
      >
        <div className="bg-surface-raised shadow-ak-segment max-w-75 overflow-hidden rounded-xl rounded-ss-sm">
          <div className="text-ak-body text-ink flex flex-col gap-1.5 px-3 pt-2.5 pb-1.5">
            {lines.map((segments, index) => (
              <p key={index}>
                {segments.map((segment, segmentIndex) =>
                  segment.kind === 'text' ? (
                    <Fragment key={segmentIndex}>{segment.text}</Fragment>
                  ) : (
                    <b key={segmentIndex} className="font-semibold">
                      {isLtrVariable(segment.variable) ? (
                        <bdi dir="ltr" className="tabular-nums">
                          {segment.text}
                        </bdi>
                      ) : (
                        segment.text
                      )}
                    </b>
                  )
                )}
              </p>
            ))}
            <bdi className="text-ink-muted self-end text-[11px] tabular-nums">
              {formatTemplatePreviewTimestamp(language)}
            </bdi>
          </div>
          {[template.confirmButton, template.cancelButton].map((reply) => (
            <div
              key={reply}
              className="border-line text-wa-action text-ak-body flex h-10 items-center justify-center border-t font-semibold"
            >
              {reply}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
