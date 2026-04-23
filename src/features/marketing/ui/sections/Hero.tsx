'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { SocialProof } from '@/features/marketing/ui/components/SocialProof'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import ScrollDownArrow from './ScrollDownArrow'
import { useTranslations } from 'next-intl'
import { LogoTicker } from '@/features/marketing/ui/components/LogoTicker'
import dynamic from 'next/dynamic'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { useRouter } from 'next/navigation'
import { withLocale } from '@/shared/lib/locale'

const ChatInterface = dynamic(
  () =>
    import('@/features/marketing/ui/components/ChatInterface').then(
      (mod) => mod.ChatInterface
    ),
  { ssr: false }
)

function Hero() {
  const t = useTranslations('hero')
  const { locale, isRTL } = useLocaleInfo()
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  const baseTransition = {
    duration: shouldReduceMotion ? 0 : 0.6,
  }

  return (
    <section className="relative flex min-h-screen flex-col justify-center gap-8 overflow-hidden px-6 pt-20 pb-10 sm:gap-10 md:flex-row md:items-center md:px-12 lg:gap-16 lg:px-20 lg:pt-24 lg:pb-20 xl:px-32">
      <div className="flex max-w-4xl flex-col items-center text-center md:w-3/5 md:items-start md:text-left">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...baseTransition, delay: 0.1 }}
          className="mb-4 flex max-w-4xl flex-col items-center gap-2.5 sm:mb-6 md:items-start lg:mb-8"
        >
          <h1
            className={`${isRTL ? 'text-right' : 'text-left'} landing-title max-w-4xl`}
          >
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
          transition={{ ...baseTransition, delay: 0.2 }}
          className="mb-6 self-stretch sm:mb-7 lg:max-w-2xl"
        >
          <div className="border-slate-200 backdrop-blur-sm">
            <p
              className={`${isRTL ? 'text-right' : 'text-left'} landing-subtitle text-slate-700`}
            >
              {t('subtitle')}
            </p>
            <ul
              className={`${isRTL ? 'text-right' : 'text-left'} mt-4 space-y-2.5 text-sm leading-7 font-medium text-slate-700 sm:text-base lg:text-lg`}
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
          transition={{ ...baseTransition, delay: 0.3 }}
          className="mb-3 flex w-full flex-col items-center justify-center gap-4 sm:mb-4 sm:gap-5 md:flex-row md:justify-start lg:mb-6"
        >
          <SocialProof />
          <button
            onClick={() => router.push(withLocale('/signup', locale))}
            className="group relative flex w-auto items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-gray-400/70 sm:w-auto sm:px-8 sm:py-4 md:flex md:text-base lg:py-5 lg:text-lg"
            suppressHydrationWarning
          >
            {t('cta')}
            {isRTL ? (
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
            )}
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...baseTransition, delay: 0.35 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <p className="text-xs font-semibold tracking-tight text-slate-500 sm:text-sm md:text-base">
            {t('no_credit_card')}
          </p>
        </motion.div>

        {/* Spacer */}
        <div className="hidden md:flex md:flex-1" />

        {/* Logo Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.8,
            delay: 0.6,
          }}
          className="mt-2 w-full sm:mt-4"
        >
          <h3
            className={`${isRTL ? 'text-right' : 'text-left'} my-3 text-xs font-semibold tracking-tight text-slate-500 sm:text-sm md:text-base lg:mt-0 lg:mb-4`}
          >
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
    </section>
  )
}

export default Hero
