'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, ShieldCheck, Store, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

interface ValueProp {
  id: string
  icon: LucideIcon
}

const VALUE_PROPS: ValueProp[] = [
  { id: 'returns', icon: ShieldCheck },
  { id: 'shipping', icon: Zap },
  { id: 'api', icon: MessageCircle },
  { id: 'merchants', icon: Store },
]

export function HeroValueProps() {
  const t = useTranslations('hero.values')
  const shouldReduceMotion = useReducedMotion()

  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {VALUE_PROPS.map(({ id, icon: Icon }, index) => (
        <motion.li
          key={id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : index * 0.08,
          }}
          className="flex flex-col items-center text-center sm:items-start sm:text-start"
        >
          <span className="bg-primary-subtle text-primary ring-primary-border/60 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
            <Icon className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            {t(`${id}_title`)}
          </h3>
          <p className="text-muted-foreground max-w-60 text-[0.9375rem] leading-relaxed">
            {t(`${id}_body`)}
          </p>
        </motion.li>
      ))}
    </ul>
  )
}
