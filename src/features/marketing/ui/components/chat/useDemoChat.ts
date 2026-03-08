import { useEffect, useMemo, useRef, useState } from 'react'
import { DemoMessage } from './demo-message.model'

export function useDemoChat(t: (key: string) => string) {
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<DemoMessage[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)

  const conversation = useMemo<DemoMessage[]>(
    () => [
      {
        type: 'bot',
        text: t('chat.bot_1'),
        delay: 1000,
        buttons: [
          { text: t('chat.buttons.confirm'), action: 'confirm' },
          { text: t('chat.buttons.cancel'), action: 'cancel' },
          { text: t('chat.buttons.will_confirm_later'), action: 'later' },
        ],
        selectedAction: 'confirm',
      },
      {
        type: 'user',
        text: t('chat.user_1'),
        delay: 2000,
      },
      {
        type: 'bot',
        text: t('chat.request_location'),
        delay: 2000,
        buttons: [
          { text: t('chat.buttons.send_location'), action: 'location' },
        ],
        selectedAction: 'location',
      },
      {
        type: 'user',
        contentType: 'location',
        text: t('chat.location_shared'),
        locationData: {
          lat: 30.0444,
          lng: 31.2357,
          address: '123 El Tahrir Street, Cairo',
        },
        delay: 2500,
      },
      {
        type: 'bot',
        text: t('chat.bot_5'),
        delay: 2000,
      },
      {
        type: 'bot',
        text: t('chat.bot_6'),
        delay: 2500,
      },
    ],
    [t]
  )

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isTyping])

  useEffect(() => {
    // Collect all timer IDs so we can clear ALL of them on cleanup.
    // The original code returned clearTimeout inside the outer setTimeout
    // callback — that return value is ignored by React, so the inner timer
    // was never cancelled on unmount, causing setState on an unmounted component.
    const timers: ReturnType<typeof setTimeout>[] = []

    if (currentStep >= conversation.length) {
      timers.push(
        setTimeout(() => {
          setMessages([])
          setCurrentStep(0)
        }, 11000)
      )
      return () => timers.forEach(clearTimeout)
    }

    const message = conversation[currentStep]

    if (message.type === 'bot') {
      timers.push(
        setTimeout(() => {
          setIsTyping(true)
          timers.push(
            setTimeout(() => {
              setIsTyping(false)
              setMessages((prev) => [...prev, message])
              setCurrentStep((prev) => prev + 1)
            }, message.delay)
          )
        }, 0)
      )
    } else {
      timers.push(
        setTimeout(() => {
          setMessages((prev) => [...prev, message])
          setCurrentStep((prev) => prev + 1)
        }, message.delay)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [conversation, currentStep])

  return {
    messages,
    isTyping,
    scrollAreaRef,
  }
}
