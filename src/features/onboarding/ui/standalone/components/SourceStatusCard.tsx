'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('StandaloneOnboarding')

interface SourceStatusCardProps {
  identity: string
}

/**
 * Compact read-only status for the connected order source. The technical
 * identifier stays collapsed — most merchants never need it — and Copy ID only
 * appears once the value is actually on screen.
 */
export function SourceStatusCard({ identity }: SourceStatusCardProps) {
  const t = useTranslations('standaloneOnboarding')
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(identity)
      setCopied(true)
    } catch (error) {
      logger.error('Failed to copy source identity', error)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-start">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {t('sourceType')}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{t('source.ready')}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={isRevealed}
          onClick={() => {
            setIsRevealed((current) => !current)
            setCopied(false)
          }}
        >
          {isRevealed ? t('source.hideId') : t('source.showId')}
        </Button>
      </div>

      {isRevealed && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <code
            dir="ltr"
            aria-label={t('source.idLabel')}
            className="min-w-0 flex-1 text-start text-xs break-all text-slate-700"
          >
            {identity}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopy()}
          >
            {copied ? t('copied') : t('copy')}
          </Button>
        </div>
      )}
    </div>
  )
}
