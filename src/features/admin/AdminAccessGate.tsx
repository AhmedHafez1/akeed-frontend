'use client'

import { useEffect, useState } from 'react'
import { ShieldX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button, Skeleton } from '@/shared/ui'
import { AdminApiError, getAdminSession } from './adminApi'

interface AdminAccessGateProps {
  children: React.ReactNode
}

export function AdminAccessGate({ children }: AdminAccessGateProps) {
  const t = useTranslations('adminCommon')
  const { isRTL } = useLocaleInfo()
  const [state, setState] = useState<
    'loading' | 'allowed' | 'forbidden' | 'error'
  >('loading')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    getAdminSession()
      .then(() => setState('allowed'))
      .catch((error: unknown) => {
        if (error instanceof AdminApiError) {
          setRequestId(error.requestId)
          setState(error.status === 403 ? 'forbidden' : 'error')
          return
        }
        setState('error')
      })
  }, [retryKey])

  if (state === 'allowed') return <>{children}</>
  if (state === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 p-8">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <main
      className="grid min-h-screen place-items-center bg-slate-50 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldX className="mx-auto mb-4 size-10 text-slate-500" />
        <h1 className="text-xl font-semibold text-slate-950">
          {state === 'forbidden' ? t('accessRequired') : t('accessError')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {state === 'forbidden'
            ? t('accessRequiredBody')
            : t('accessErrorBody')}
        </p>
        {requestId && (
          <p className="mt-3 font-mono text-xs text-slate-500">
            {t('requestId', { id: requestId })}
          </p>
        )}
        {state === 'error' && (
          <Button
            className="mt-5"
            onClick={() => {
              setState('loading')
              setRetryKey((value) => value + 1)
            }}
          >
            {t('retry')}
          </Button>
        )}
      </div>
    </main>
  )
}
