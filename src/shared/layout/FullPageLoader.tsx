'use client'

import { useTranslations } from 'next-intl'

interface FullPageLoaderProps {
  message?: string
}

export function FullPageLoader({ message }: FullPageLoaderProps) {
  const t = useTranslations('common')
  const displayMessage = message ?? t('loading')

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="text-sm text-gray-600">{displayMessage}</p>
      </div>
    </div>
  )
}
