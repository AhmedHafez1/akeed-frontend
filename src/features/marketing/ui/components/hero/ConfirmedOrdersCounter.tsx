'use client'

import { useInView, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCredits } from '@/shared/lib/money'

const COUNT_UP_MS = 1200

interface ConfirmedOrdersCounterProps {
  /** The backend's real total; never a placeholder. */
  total: number
}

export function ConfirmedOrdersCounter({ total }: ConfirmedOrdersCounterProps) {
  const t = useTranslations('hero.counter')
  const { locale } = useLocaleInfo()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  const [shown, setShown] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!isInView || reduceMotion || finished) return
    let frame = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / COUNT_UP_MS, 1)
      const eased = 1 - (1 - progress) ** 3
      setShown(Math.round(total * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setFinished(true)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, reduceMotion, finished, total])

  const displayed = reduceMotion || finished ? total : shown

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1.5 px-4 text-center"
    >
      <p className="text-muted-foreground text-sm text-balance sm:text-base">
        {t('lead')}
      </p>
      <p className="text-foreground flex flex-col items-center gap-0.5">
        <span
          aria-hidden
          className="text-primary text-4xl leading-tight font-bold tracking-tight tabular-nums sm:text-5xl"
        >
          {formatCredits(displayed, locale)}
        </span>
        <span className="sr-only">{formatCredits(total, locale)} </span>
        <span className="text-sm font-medium sm:text-base">{t('label')}</span>
      </p>
    </div>
  )
}
