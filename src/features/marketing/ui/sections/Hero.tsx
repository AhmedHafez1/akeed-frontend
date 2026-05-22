'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Play,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { PlatformAvailability } from '@/features/marketing/ui/components/PlatformAvailability'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'

const ChatInterface = dynamic(
  () =>
    import('@/features/marketing/ui/components/ChatInterface').then(
      (mod) => mod.ChatInterface
    ),
  { ssr: false }
)

function Hero() {
  const t = useTranslations('hero')
  const { isRTL } = useLocaleInfo()
  const shouldReduceMotion = useReducedMotion()

  const proofItems = [
    {
      label: t('proof_shopify'),
      icon: (
        <Image
          src="/images/landing/logos/shopify_icon_1.png"
          alt={t('proof_shopify')}
          width={32}
          height={32}
          unoptimized
          className="h-7 w-7 object-contain"
        />
      ),
    },
    {
      label: t('proof_meta'),
      icon: (
        <Image
          src="/images/landing/logos/wa_icon_1.png"
          alt={t('proof_meta')}
          width={32}
          height={32}
          unoptimized
          className="h-7 w-7 object-contain"
        />
      ),
    },
    {
      label: t('proof_built'),
      icon: (
        <Image
          src="/images/landing/logos/built_icon.jpg"
          alt={t('proof_built')}
          width={32}
          height={32}
          unoptimized
          className="h-7 w-7 rounded-sm object-cover"
        />
      ),
    },
  ]

  const microcopyItems = [
    {
      label: t('microcopy_free'),
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
    },
    {
      label: t('microcopy_no_card'),
      icon: <CreditCard className="h-3.5 w-3.5 text-emerald-600" />,
    },
    {
      label: t('microcopy_setup'),
      icon: <Clock3 className="h-3.5 w-3.5 text-emerald-600" />,
    },
  ] as const

  const baseTransition = {
    duration: shouldReduceMotion ? 0 : 0.6,
  }

  const scrollToHowItWorks = () => {
    document
      .getElementById('how-it-works')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="relative overflow-hidden px-4 pt-22 pb-10 sm:px-6 sm:pt-26 sm:pb-14 lg:px-10 lg:pt-24 lg:pb-12">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.82fr)] lg:gap-12 xl:gap-16">
        <div className="flex w-full max-w-3xl flex-col items-center text-center lg:items-start lg:text-left">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.1 }}
            className="mb-5 flex max-w-4xl flex-col items-center gap-2.5 lg:items-start"
          >
            <h1
              className={`${isRTL ? 'text-right' : 'text-left'} max-w-5xl text-4xl leading-[1.08] font-extrabold tracking-normal text-slate-950 sm:text-5xl lg:text-5xl xl:text-6xl`}
            >
              {t('title')}{' '}
              <span className="bg-linear-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                {t('highlight')}
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.2 }}
            className="mb-6 max-w-2xl"
          >
            <p
              className={`${isRTL ? 'text-right leading-8 lg:leading-9' : 'text-left leading-7 lg:leading-8'} text-base font-medium text-slate-600 sm:text-lg`}
            >
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Trust proof */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.25 }}
            className="mb-7 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {proofItems.map((item) => (
              <div
                key={item.label}
                className="flex min-h-20 items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_14px_32px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/80"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 shadow-inner shadow-white ring-1 ring-emerald-100/70">
                  {item.icon}
                </span>
                <span className="text-start text-sm leading-5 font-extrabold text-slate-950">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.3 }}
            className="mb-4 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <a
              href={SHOPIFY_APP_STORE_LISTING_URL}
              className="group relative flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-7 text-lg font-extrabold text-white shadow-[0_18px_36px_rgba(5,150,105,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_22px_44px_rgba(5,150,105,0.34)] focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:outline-none sm:w-auto sm:min-w-76"
              suppressHydrationWarning
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/95 shadow-sm">
                <Image
                  src="/images/landing/logos/shopify_icon_1.png"
                  alt={t('shopify_available')}
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span>{t('cta')}</span>
              {isRTL ? (
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              )}
            </a>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-white/90 px-7 text-base font-extrabold text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50/70 hover:text-emerald-800 hover:ring-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:outline-none sm:w-auto sm:min-w-56"
            >
              <Play className="h-5 w-5 fill-emerald-600 text-emerald-600" />
              {t('secondary_cta')}
            </button>
          </motion.div>

          {/* Microcopy */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.35 }}
            className="mb-8 flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm font-bold text-slate-500 lg:justify-start"
          >
            {microcopyItems.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 whitespace-nowrap"
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </motion.div>

          {/* Platform availability */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.8,
              delay: 0.45,
            }}
            className="w-full max-w-2xl"
          >
            <PlatformAvailability isRTL={isRTL} />
          </motion.div>
        </div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...baseTransition, delay: 0.35 }}
          className="relative hidden items-center justify-center lg:flex"
        >
          <ChatInterface />
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
