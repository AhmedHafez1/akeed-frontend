'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useDemoChat } from '@/features/marketing/ui/components/chat/useDemoChat'
import { ChatHeader } from './chat/ChatHeader'
import { ChatInputBar } from './chat/ChatInputBar'
import { ChatMessageList } from './chat/ChatMessageList'

const HEADER_TIME = '09:41'

export function ChatInterface() {
  const t = useTranslations('demo')
  const { messages, isTyping, scrollAreaRef } = useDemoChat(t)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="relative w-full md:w-auto"
    >
      <div className="relative mx-auto w-full max-w-[320px] md:w-80">
        <div className="pointer-events-none absolute inset-x-8 -bottom-6 h-14 rounded-full bg-slate-900/12 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-linear-to-br from-slate-300/35 via-white/10 to-slate-200/80 blur-2xl" />

        <div className="relative rounded-[3rem] border-8 border-slate-900 bg-slate-900 p-2 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.5)]">
          <div className="absolute top-3 left-1/2 z-20 h-6 w-32 -translate-x-1/2 rounded-full bg-slate-900" />

          <div className="relative overflow-hidden rounded-[2.2rem] bg-white">
            <ChatHeader
              statusLabel={t('phone_status')}
              timeLabel={HEADER_TIME}
            />

            <ChatMessageList
              messages={messages}
              isTyping={isTyping}
              scrollRef={scrollAreaRef}
            />

            <ChatInputBar placeholder={t('typing_placeholder')} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
