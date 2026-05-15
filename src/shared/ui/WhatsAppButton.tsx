'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

interface WhatsAppButtonProps {
  offsetForMobileCta?: boolean
}

export function WhatsAppButton({
  offsetForMobileCta = false,
}: WhatsAppButtonProps) {
  const t = useTranslations('whatsapp_button')

  /**
   * Opens WhatsApp Web with a given message and phone number
   * @param {string} message - The message to be sent
   * @param {string} phoneNumber - The phone number to send the message to
   */
  const handleClick = () => {
    const message = encodeURIComponent(t('message'))
    const phoneNumber = '201020956627'
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'fixed right-4 z-40 flex h-13 w-13 touch-manipulation items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl md:hidden',
        offsetForMobileCta ? 'bottom-24' : 'bottom-4'
      )}
      aria-label={t('text')}
    >
      <span className="sr-only">{t('text')}</span>
      <MessageCircle className="h-6 w-6 shrink-0" />
    </button>
  )
}
