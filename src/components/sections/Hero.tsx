'use client'

import { motion } from 'framer-motion'
import { SocialProof } from '../ui/SocialProof'
import { ChevronRight, ChevronLeft, Star } from 'lucide-react'
import ScrollDownArrow from './ScrollDownArrow'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { ChatInterface } from '../ui/ChatInterface'
import { LogoTicker } from '../ui'
import { useState } from 'react'
import { ReservationModal } from './ReservationModal'
import Image from 'next/image'

function Hero() {
  const t = useTranslations('hero')
  const pathname = usePathname()
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)

  // Extract locale from pathname (assuming /[locale]/...)
  const locale = pathname?.split('/')[1] === 'en' ? 'en' : 'ar'

  return (
    <section className="relative flex min-h-screen flex-col justify-center gap-6 overflow-hidden px-6 pt-20 pb-8 sm:gap-8 sm:px-6 md:flex-row md:items-end md:gap-16 md:px-12 lg:gap-20 lg:px-24 lg:pt-22 lg:pb-24 xl:px-48">
      <div className="flex max-w-4xl flex-col items-center text-center md:w-3/5 md:justify-center md:self-stretch">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 flex flex-col items-center space-y-2 sm:mb-6 lg:mb-8"
        >
          <h1 className="text-2xl leading-tight font-black text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            {t('title')}{' '}
            <span className="bg-linear-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              {t('highlight')}
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 self-start sm:mb-6 lg:px-20"
        >
          <div className="border-slate-200 backdrop-blur-sm sm:p-5">
            <p
              className={`${locale === 'ar' ? 'text-right' : 'text-left'} text-sm text-slate-700 md:text-lg lg:text-xl lg:leading-relaxed`}
            >
              {t('subtitle')}
            </p>
            <ul
              className={`${locale === 'ar' ? 'text-right' : 'text-left'} md:text-md mt-3 space-y-2 text-sm text-slate-700 sm:text-base lg:text-lg`}
            >
              <li>{t('subtitle_bullet_1')}</li>
              <li>{t('subtitle_bullet_2')}</li>
              <li>{t('subtitle_bullet_3')}</li>
              <li>{t('subtitle_bullet_4')}</li>
              <li>{t('subtitle_bullet_5')}</li>
            </ul>
          </div>
        </motion.div>

        {/* CTAs & Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3 flex w-full flex-col items-center justify-center gap-4 sm:mb-4 sm:gap-5 md:flex-row lg:mb-6"
        >
          <SocialProof />
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="group relative flex w-auto items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-gray-400/70 sm:w-auto sm:px-8 sm:py-4 md:flex md:text-base lg:py-5 lg:text-lg"
            suppressHydrationWarning
          >
            {t('cta')}
            {locale === 'ar' ? (
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
            )}
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <p className="text-xs font-semibold text-slate-500 sm:text-sm md:text-base">
            {t('no_credit_card')}
          </p>
        </motion.div>

        {/* Spacer */}
        <div className="hidden md:flex md:flex-1" />

        {/* Logo Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-2 sm:mt-4"
        >
          <h3 className="my-3 text-xs font-semibold text-slate-500 sm:text-sm md:text-base lg:mt-0 lg:mb-4">
            {t('easy_integrated')}
          </h3>

          <LogoTicker />
        </motion.div>
      </div>

      {/* Chat Interface */}
      <div className="flex w-full scale-90 items-center justify-center sm:scale-95 md:w-2/5 md:scale-100 lg:w-auto">
        <ChatInterface />
      </div>

      {/* Scroll Indicator */}
      <ScrollDownArrow to="problem" className="hidden sm:block" />
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
      />
    </section>
  )
}

export default Hero
