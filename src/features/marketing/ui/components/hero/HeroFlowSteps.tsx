'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { LandingIconBadge } from '@/features/marketing/ui/components/LandingPrimitives'

interface FlowStep {
  id: string
  title: string
  meta: string
  icon: ReactNode
}

const STEP_STAGGER = 0.18

/**
 * The "order → WhatsApp → confirm → updated" sequence shown beside the phone,
 * so the hero explains the product before the visitor reads any copy.
 */
export function HeroFlowSteps() {
  const t = useTranslations('hero.flow')
  const shouldReduceMotion = useReducedMotion()

  const steps: FlowStep[] = [
    {
      id: 'order',
      title: t('order_title'),
      meta: t('order_meta'),
      icon: <ShoppingCart />,
    },
    {
      id: 'message',
      title: t('message_title'),
      meta: t('message_meta'),
      icon: (
        <Image
          src="/images/landing/logos/wa_icon_1.png"
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 object-contain"
        />
      ),
    },
    {
      id: 'confirm',
      title: t('confirm_title'),
      meta: t('confirm_meta'),
      icon: <UserRound />,
    },
    {
      id: 'updated',
      title: t('updated_title'),
      meta: t('updated_meta'),
      icon: <CheckCircle2 />,
    },
  ]

  return (
    <ol className="relative flex w-64 flex-col gap-10 xl:w-68">
      {steps.map((step, index) => {
        const delay = shouldReduceMotion ? 0 : 0.5 + index * STEP_STAGGER
        const isLast = index === steps.length - 1

        return (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay }}
            className="relative"
          >
            {!isLast && (
              <span
                aria-hidden
                className="border-primary/45 absolute start-9 top-full h-10 border-s-2 border-dashed"
              />
            )}

            <div className="rounded-card bg-card/95 shadow-card ring-border/60 flex items-center gap-3 px-3.5 py-3 ring-1 backdrop-blur">
              <LandingIconBadge
                size="sm"
                className="h-11 w-11 [&_svg]:h-6 [&_svg]:w-6"
                tone='slate'
              >
                {step.icon}
              </LandingIconBadge>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">
                  {step.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {step.meta}
                </p>
              </div>

              <motion.span
                initial={{ scale: shouldReduceMotion ? 1 : 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 18,
                  delay: delay + (shouldReduceMotion ? 0 : 0.3),
                }}
                className="bg-slate-500 text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              >
                {index + 1}
              </motion.span>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
