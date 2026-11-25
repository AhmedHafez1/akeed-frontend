'use client'

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useRef, type ReactNode } from 'react'
import type { MockupSegment } from '@/features/marketing/config/heroMockup'
import {
  DEMO_ORDERS,
  useMockupTemplate,
} from '@/features/marketing/ui/components/useMockupTemplate'
import { getMessagePreviewTimestamp } from '@/shared/lib/messageLanguage'
import { cn } from '@/shared/lib/utils'
import {
  WhatsAppChatHeader,
  WhatsAppMessageBubble,
  WhatsAppPhoneFrame,
  WhatsAppTemplateMessage,
  WhatsAppTypingIndicator,
} from '@/shared/ui/whatsapp'
import { reachedStage, useHeroConfirmLoop } from './useHeroConfirmLoop'

const bubbleMotion = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
}

interface HeroPhoneMockupProps {
  className?: string
}

/**
 * The registered confirmation template of the page's language, filled with a
 * demo order, playing out as the customer sees it: the message, a tap on
 * Confirm, the reply and Akeed's thank-you.
 */
export function HeroPhoneMockup({ className }: HeroPhoneMockupProps) {
  const t = useTranslations('hero')
  const tPhone = useTranslations('onboarding.test.phone')
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-80px' })
  const reduceMotion = useReducedMotion() ?? false
  const stage = useHeroConfirmLoop(inView, reduceMotion)
  const { language, template, direction, customer, formatTotal } =
    useMockupTemplate()
  const time = getMessagePreviewTimestamp(language)

  const values = {
    customer,
    store: template.store,
    order: DEMO_ORDERS.hero.number,
    total: formatTotal(DEMO_ORDERS.hero),
  }

  const renderSegment = (segment: MockupSegment, index: number): ReactNode => {
    if (typeof segment === 'string') return segment
    const text = values[segment.variable]
    // The order number is the one value an RTL line can reorder.
    const node =
      segment.variable === 'order' ? <bdi dir="ltr">{text}</bdi> : text
    return segment.bold ? (
      <b key={index} className="font-bold">
        {node}
      </b>
    ) : (
      <span key={index}>{node}</span>
    )
  }

  const renderLines = (lines: ReadonlyArray<ReadonlyArray<MockupSegment>>) =>
    lines.map((line, index) => <p key={index}>{line.map(renderSegment)}</p>)

  return (
    <div
      ref={ref}
      role="img"
      aria-label={t('mockup_label')}
      className={cn('w-full', className)}
    >
      <WhatsAppPhoneFrame className="max-w-66 lg:max-w-70">
        <WhatsAppChatHeader
          name={tPhone('senderName')}
          statusLabel={tPhone('senderStatus')}
          avatarAlt=""
        />
        {/* Anchored to the bottom, like a chat: older lines fade out at the top. */}
        <div
          dir={direction}
          lang={language}
          className="flex h-96 flex-col justify-end gap-2.5 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_2.5rem)] px-2.5 pt-3 pb-4 sm:h-108"
        >
          <div className="flex justify-center">
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[0.6875rem] text-slate-600 shadow-sm dark:bg-[#182229] dark:text-slate-300">
              {tPhone('today')}
            </span>
          </div>

          <AnimatePresence initial={false} mode="popLayout">
            {stage === 'typing' && (
              <motion.div key="typing-1" {...bubbleMotion}>
                <WhatsAppTypingIndicator />
              </motion.div>
            )}

            {stage !== 'typing' && (
              <motion.div
                key="message"
                layout
                {...bubbleMotion}
                className="w-[94%]"
              >
                <WhatsAppTemplateMessage
                  timeLabel={time}
                  buttons={[
                    { label: template.confirm, tone: 'confirm' },
                    { label: template.cancel, tone: 'cancel' },
                  ]}
                  pressedTone={
                    reachedStage(stage, 'pressed') ? 'confirm' : undefined
                  }
                >
                  {renderLines(template.lines)}
                </WhatsAppTemplateMessage>
              </motion.div>
            )}

            {reachedStage(stage, 'replied') && (
              <motion.div
                key="reply"
                layout
                {...bubbleMotion}
                className="max-w-[80%] self-end"
              >
                <WhatsAppMessageBubble
                  direction="outgoing"
                  timeLabel={time}
                  className="px-1.5"
                >
                  {template.confirm}
                </WhatsAppMessageBubble>
              </motion.div>
            )}

            {stage === 'thanksTyping' && (
              <motion.div key="typing-2" layout {...bubbleMotion}>
                <WhatsAppTypingIndicator />
              </motion.div>
            )}

            {stage === 'thanked' && (
              <motion.div
                key="thanks"
                layout
                {...bubbleMotion}
                className="max-w-[88%]"
              >
                <WhatsAppMessageBubble
                  direction="incoming"
                  timeLabel={time}
                  className="px-2"
                >
                  {renderLines(template.thankYou)}
                </WhatsAppMessageBubble>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </WhatsAppPhoneFrame>
    </div>
  )
}
