'use client'

import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'

export function WhatsAppButton() {
  const t = useTranslations('whatsapp_button')

  const handleClick = () => {
    const message = encodeURIComponent(t('message'))
    const phoneNumber = '201020956627'
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="bg-linear-gradient-to-r fixed right-0 bottom-0 left-0 z-50 mx-auto mb-4 flex min-h-13 w-[calc(100%-2rem)] max-w-md transform touch-manipulation items-center justify-center gap-3 rounded-xl bg-linear-to-r from-emerald-600 to-[#25D366] px-6 py-4 text-base font-semibold text-white transition-all duration-300 ease-out hover:shadow-sm md:hidden"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
      aria-label={t('text')}
    >
      <span className="truncate">{t('text')}</span>
      <MessageCircle className="h-6 w-6 shrink-0" />
    </button>
  )
}
