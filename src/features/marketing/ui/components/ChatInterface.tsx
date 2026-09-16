'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useDemoChat } from '@/features/marketing/ui/components/chat/useDemoChat'
import { ChatHeader } from './chat/ChatHeader'
import { ChatInputBar } from './chat/ChatInputBar'
import { ChatMessageList } from './chat/ChatMessageList'

export function ChatInterface() {
  const t = useTranslations('demo')
  const { messages, isTyping, scrollAreaRef } = useDemoChat(t)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="relative w-full md:w-auto"
    >
      <div className="relative mx-auto w-full max-w-75 md:w-75">
        <div className="pointer-events-none absolute inset-x-8 -bottom-6 h-14 rounded-full bg-slate-900/15 blur-2xl" />

        <div className="shadow-overlay relative rounded-[2.75rem] border-[10px] border-slate-900 bg-slate-900 ring-1 ring-slate-700/60">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />

          <div className="relative overflow-hidden rounded-[2.1rem] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center">
            <ChatHeader
              name={t('bot_name_short')}
              statusLabel={t('phone_status')}
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
