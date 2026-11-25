import type { ReactNode } from 'react'
import { WhatsAppChatHeader } from './chat-header'
import { WhatsAppMessageBubble } from './message-bubble'
import { WhatsAppPhoneFrame } from './phone-frame'
import {
  WhatsAppTemplateButtons,
  type WhatsAppReplyTone,
  type WhatsAppTemplateButton,
} from './reply-buttons'

interface WhatsAppPhonePreviewProps {
  senderName: string
  senderStatus: string
  avatarAlt: string
  dayLabel: string
  /** One entry per line; a node when a line carries bold or isolated text. */
  paragraphs: ReadonlyArray<ReactNode>
  timeLabel: string
  buttons: ReadonlyArray<WhatsAppTemplateButton>
  emphasizedTone?: WhatsAppReplyTone
  /** The message follows its template language, not the app locale. */
  messageDir?: 'rtl' | 'ltr'
  messageLang?: string
  /** An image header above the text, as a template with one shows it. */
  headerImage?: { src: string; alt: string }
}

/**
 * A static phone showing one business template message with its reply
 * buttons: what a customer sees when Akeed asks them to confirm an order.
 */
export function WhatsAppPhonePreview({
  senderName,
  senderStatus,
  avatarAlt,
  dayLabel,
  paragraphs,
  timeLabel,
  buttons,
  emphasizedTone,
  messageDir,
  messageLang,
  headerImage,
}: WhatsAppPhonePreviewProps) {
  return (
    <WhatsAppPhoneFrame>
      <WhatsAppChatHeader
        name={senderName}
        statusLabel={senderStatus}
        avatarAlt={avatarAlt}
      />
      <div className="min-h-80 space-y-3 px-3 py-4">
        <div className="flex justify-center">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[0.6875rem] text-slate-600 shadow-sm dark:bg-[#182229] dark:text-slate-300">
            {dayLabel}
          </span>
        </div>
        <div
          dir={messageDir}
          lang={messageLang}
          className="mx-auto my-8 w-[92%] overflow-hidden rounded-xl rounded-ss-sm bg-white shadow-sm dark:bg-[#202c33]"
        >
          {headerImage && (
            // A merchant's own upload from storage or a local file: not a
            // build-time asset next/image could optimise.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerImage.src}
              alt={headerImage.alt}
              className="block aspect-[1200/628] w-full rounded-lg object-cover p-1"
            />
          )}
          <WhatsAppMessageBubble
            direction="incoming"
            timeLabel={timeLabel}
            className="shadow-none"
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </WhatsAppMessageBubble>
          <WhatsAppTemplateButtons
            buttons={buttons}
            emphasizedTone={emphasizedTone}
          />
        </div>
      </div>
    </WhatsAppPhoneFrame>
  )
}
