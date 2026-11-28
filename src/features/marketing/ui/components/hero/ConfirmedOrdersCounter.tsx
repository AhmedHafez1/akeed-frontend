'use client'

import { useInView, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCredits } from '@/shared/lib/money'

const COUNT_UP_MS = 1200
const NUMBER_CLASS =
  'text-[4.375rem] leading-tight font-extrabold tabular-nums sm:text-[5.125rem]'
const LABEL_CLASS = 'text-base font-semibold text-balance sm:text-lg'

interface ConfirmedOrdersCounterProps {
  /** The backend's real total; never a placeholder. */
  total: number
  /** Null when the backend could not count the stores: only orders show. */
  stores?: number | null
}

export function ConfirmedOrdersCounter({
  total,
  stores = null,
}: ConfirmedOrdersCounterProps) {
  const t = useTranslations('hero.counter')
  const { locale } = useLocaleInfo()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  // How far the count-up has run, from 0 to 1. One run drives both numbers.
  const [progress, setProgress] = useState(0)
  const finished = progress === 1

  useEffect(() => {
    if (!isInView || reduceMotion || finished) return
    let frame = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.min((now - startedAt) / COUNT_UP_MS, 1)
      setProgress(1 - (1 - elapsed) ** 3)
      if (elapsed < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, reduceMotion, finished])

  const ratio = reduceMotion ? 1 : progress
  const shown = (value: number) =>
    formatCredits(Math.round(value * ratio), locale)

  return (
    <div ref={ref} className="w-full px-4">
      <div className="bg-card ring-border shadow-card relative mx-auto flex w-full max-w-xl flex-col items-center gap-2 overflow-hidden rounded-3xl px-4 py-6 text-center ring-1 sm:px-6 sm:py-7">
        <div
          aria-hidden
          className="bg-primary-subtle pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full blur-3xl"
        />
        <p className="text-muted-foreground relative text-sm text-balance sm:text-base">
          {t('lead')}
        </p>
        {/* Stores come first: on top on a phone, on the start side beyond it. */}
        <div className="text-foreground relative flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
          {stores !== null && (
            <p className="flex flex-col items-center gap-1">
              <span aria-hidden data-stat="stores" className={NUMBER_CLASS}>
                {shown(stores)}
              </span>
              <span className="sr-only">{formatCredits(stores, locale)} </span>
              <span className={LABEL_CLASS}>
                {t('stores', { count: stores })}
              </span>
            </p>
          )}
          <p className="flex flex-col items-center gap-1">
            <span className="flex items-center gap-3">
              {/* A live dot: the figure is the real running total. */}
              <span aria-hidden className="relative flex h-3 w-3">
                <span className="bg-success absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping" />
                <span className="bg-success relative inline-flex h-3 w-3 rounded-full" />
              </span>
              <span
                aria-hidden
                data-stat="orders"
                className={`from-primary to-success bg-linear-to-br bg-clip-text text-transparent ${NUMBER_CLASS}`}
              >
                {shown(total)}
              </span>
            </span>
            <span className="sr-only">{formatCredits(total, locale)} </span>
            <span className={LABEL_CLASS}>{t('label')}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
