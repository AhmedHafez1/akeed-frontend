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
      icon: <CheckCircle2 className="text-primary h-3.5 w-3.5" />,
    },
    {
      label: t('microcopy_no_card'),
      icon: <CreditCard className="text-primary h-3.5 w-3.5" />,
    },
    {
      label: t('microcopy_setup'),
      icon: <Clock3 className="text-primary h-3.5 w-3.5" />,
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
    <section className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:px-10 lg:pt-34 lg:pb-22">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.75fr)] lg:gap-10 xl:gap-12">
        <div className="flex w-full max-w-3xl flex-col items-center text-center lg:items-start lg:text-left">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.1 }}
            className="mb-6 flex max-w-4xl flex-col items-center gap-2.5 lg:items-start"
          >
            <h1
              className={`${isRTL ? 'text-right' : 'text-left'} text-display text-foreground max-w-5xl text-balance`}
            >
              {t('title')}{' '}
              <span className="from-primary-hover to-primary bg-linear-to-r bg-clip-text text-transparent">
                {t('highlight')}
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.2 }}
            className="mb-8 max-w-2xl"
          >
            <p
              className={`${isRTL ? 'text-right' : 'text-left'} text-lead text-muted-foreground text-pretty`}
            >
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Trust proof */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.25 }}
            className="mb-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {proofItems.map((item) => (
              <div
                key={item.label}
                className="rounded-card bg-card/95 shadow-card ring-border/70 flex min-h-17 items-center gap-4 px-5 ring-1"
              >
                <span className="rounded-control bg-primary-subtle ring-primary-border/70 flex h-11 w-11 shrink-0 items-center justify-center ring-1">
                  {item.icon}
                </span>
                <span className="text-foreground text-start text-sm leading-5 font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Microcopy */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.35 }}
            className="text-muted-foreground text-md mb-8 flex w-full flex-wrap content-center items-center justify-center gap-x-7 gap-y-4 font-medium"
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
            className="mb-4 w-full"
          >
            <PlatformAvailability isRTL={isRTL} />
          </motion.div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.3 }}
            className="flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <a
              href={SHOPIFY_APP_STORE_LISTING_URL}
              className="group rounded-control bg-primary text-primary-foreground shadow-brand hover:bg-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background relative flex h-19 w-full items-center justify-center gap-4 px-7 text-xl font-medium transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:min-w-76"
              suppressHydrationWarning
            >
              <span className="bg-card/95 shadow-raised flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
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
              className={`flex ${isRTL ? 'flex-row-reverse' : ''} rounded-control bg-card/90 text-foreground shadow-card ring-border hover:bg-primary-subtle/70 hover:text-primary-subtle-foreground hover:ring-primary-border focus-visible:ring-ring focus-visible:ring-offset-background h-19 w-full items-center justify-center gap-3 px-7 text-lg font-medium ring-1 transition-[background-color,box-shadow,transform,color] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:min-w-56`}
            >
              {isRTL ? (
                <Play className="fill-primary text-primary h-5 w-5 rotate-180" />
              ) : (
                <Play className="fill-primary text-primary h-5 w-5" />
              )}
              {t('secondary_cta')}
            </button>
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
