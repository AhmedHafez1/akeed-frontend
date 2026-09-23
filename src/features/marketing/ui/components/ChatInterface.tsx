'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useDemoChat } from '@/features/marketing/ui/components/chat/useDemoChat'
import { WhatsAppChatHeader, WhatsAppPhoneFrame } from '@/shared/ui/whatsapp'
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
      <WhatsAppPhoneFrame className="md:w-75">
        <WhatsAppChatHeader
          name={t('bot_name_short')}
          statusLabel={t('phone_status')}
          avatarAlt="Akeed Logo"
        />

        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          scrollRef={scrollAreaRef}
        />

        <ChatInputBar placeholder={t('typing_placeholder')} />
      </WhatsAppPhoneFrame>
    </motion.div>
  )
}
