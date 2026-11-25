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
    <div ref={ref} className="w-full px-4">
      <div className="bg-card ring-border shadow-card relative mx-auto flex w-full max-w-xl flex-col items-center gap-2 overflow-hidden rounded-3xl px-6 py-7 text-center ring-1 sm:px-12 sm:py-9">
        <div
          aria-hidden
          className="bg-primary-subtle pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full blur-3xl"
        />
        <p className="text-muted-foreground relative text-sm text-balance sm:text-base">
          {t('lead')}
        </p>
        <p className="text-foreground relative flex flex-col items-center gap-1">
          <span className="flex items-center gap-3">
            {/* A live dot: the figure is the real running total. */}
            <span aria-hidden className="relative flex h-3 w-3">
              <span className="bg-success absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping" />
              <span className="bg-success relative inline-flex h-3 w-3 rounded-full" />
            </span>
            <span
              aria-hidden
              className="from-primary to-success bg-linear-to-br bg-clip-text text-6xl leading-tight font-extrabold text-transparent tabular-nums sm:text-7xl"
            >
              {formatCredits(displayed, locale)}
            </span>
          </span>
          <span className="sr-only">{formatCredits(total, locale)} </span>
          <span className="text-base font-semibold sm:text-lg">
            {t('label')}
          </span>
        </p>
      </div>
    </div>
  )
}
