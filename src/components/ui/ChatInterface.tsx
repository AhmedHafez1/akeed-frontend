'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useDemoChat } from '@/hooks/useDemoChat'
import { ChatHeader } from './chat/ChatHeader'
import { ChatInputBar } from './chat/ChatInputBar'
import { ChatMessageList } from './chat/ChatMessageList'

const HEADER_TIME = '09:41'
const LOCATION_FALLBACK = '30.0444, 31.2357'

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
        <div className="/10 blur-1xl absolute inset-0 rounded-[3rem] bg-linear-to-br from-gray-400/20 to-gray-200" />

        <div className="relative rounded-[3rem] border-8 border-slate-900 bg-slate-900 p-2 shadow-2xl">
          <div className="absolute top-3 left-1/2 z-20 h-6 w-32 -translate-x-1/2 rounded-full bg-slate-900" />

          <div className="relative overflow-hidden rounded-[2.2rem] bg-white">
            <ChatHeader
              statusLabel={t('phone_status')}
              timeLabel={HEADER_TIME}
            />

            <ChatMessageList
              messages={messages}
              isTyping={isTyping}
              locationTitle={t('chat.location_shared')}
              locationFallbackAddress={LOCATION_FALLBACK}
              scrollRef={scrollAreaRef}
            />

            <ChatInputBar placeholder={t('typing_placeholder')} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
