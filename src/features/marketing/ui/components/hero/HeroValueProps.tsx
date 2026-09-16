'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Package, ShieldCheck, Store, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

interface ValueProp {
  id: string
  icon: LucideIcon
}

const VALUE_PROPS: ValueProp[] = [
  { id: 'returns', icon: Package },
  { id: 'shipping', icon: Zap },
  { id: 'api', icon: ShieldCheck },
  { id: 'merchants', icon: Store },
]

export function HeroValueProps() {
  const t = useTranslations('hero.values')
  const shouldReduceMotion = useReducedMotion()

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-7">
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
          className="min-w-0"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="bg-primary-subtle text-primary ring-primary-border/60 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-14 sm:w-14">
              <Icon className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 text-start">
              <h3 className="text-foreground text-md font-semibold">
                {t(`${id}_title`)}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {t(`${id}_body`)}
              </p>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}
