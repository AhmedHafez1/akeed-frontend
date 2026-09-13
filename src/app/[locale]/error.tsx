'use client'

import { useTranslations } from 'next-intl'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-foreground mb-2 text-xl font-semibold">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">
          {t('description')}
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 mb-4 text-xs">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  )
}
