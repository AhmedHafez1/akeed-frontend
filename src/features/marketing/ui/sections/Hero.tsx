'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  MessageCircle,
  Play,
  ShieldCheck,
  ShoppingBag,
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
          src="/images/landing/logos/shopify.png"
          alt=""
          width={40}
          height={40}
          className="h-9 w-9 object-contain"
        />
      ),
    },
    {
      label: t('proof_meta'),
      icon: <MessageCircle className="h-6 w-6 text-emerald-600" />,
    },
    {
      label: t('proof_built'),
      icon: <ShieldCheck className="h-6 w-6 text-emerald-700" />,
    },
  ]

  const microcopyItems = [
    {
      label: t('microcopy_free'),
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    },
    {
      label: t('microcopy_no_card'),
      icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
    },
    {
      label: t('microcopy_setup'),
      icon: <Clock3 className="h-4 w-4 text-emerald-600" />,
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
          {/* Shopify launch badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.05 }}
            className="mb-5 inline-flex items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100 sm:text-base"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
            </span>
            {t('launch_badge')}
          </motion.div>

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
            className="mb-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {proofItems.map((item) => (
              <div
                key={item.label}
                className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  {item.icon}
                </span>
                <span className="text-start text-sm leading-5 font-bold text-slate-800">
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
            className="mb-4 flex w-full flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <a
              href={SHOPIFY_APP_STORE_LISTING_URL}
              className="group relative flex h-15 w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-orange-600 to-orange-500 px-7 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 sm:w-auto sm:min-w-64 sm:text-lg"
              suppressHydrationWarning
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-600">
                <ShoppingBag className="h-5 w-5" />
              </span>
              {t('cta')}
              {isRTL ? (
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              )}
            </a>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="flex h-15 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white/85 px-7 text-base font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 sm:w-auto sm:min-w-56"
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
            className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-500 lg:justify-start"
          >
            {microcopyItems.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2">
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
