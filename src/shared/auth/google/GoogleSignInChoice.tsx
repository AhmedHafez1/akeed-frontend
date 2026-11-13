'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { LoadingButton, Separator } from '@/shared/ui'
import {
  isGoogleAuthEnabled,
  startGoogleSignIn,
} from '@/shared/lib/googleOAuth'
import type { SupportedLocale } from '@/shared/lib/locale'
import { GoogleMark } from './GoogleMark'

interface GoogleSignInChoiceProps {
  locale: SupportedLocale
  intent: 'login' | 'signup'
  source?: string | null
  returnTo?: string | null
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}

export function GoogleSignInChoice({
  disabled,
  onBusyChange,
  ...options
}: GoogleSignInChoiceProps) {
  const t = useTranslations('auth.google')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!isGoogleAuthEnabled()) return null
  const start = async () => {
    if (busy || disabled) return
    setBusy(true)
    setFailed(false)
    onBusyChange?.(true)
    try {
      window.location.assign(await startGoogleSignIn(options))
    } catch {
      console.warn('[Auth] Google sign-in could not start')
      setFailed(true)
      setBusy(false)
      onBusyChange?.(false)
    }
  }
  return (
    <div className="my-6 space-y-5">
      {failed && (
        <p
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-control border p-3 text-sm"
        >
          {t('failed')}
        </p>
      )}
      <LoadingButton
        type="button"
        variant="outline"
        size="lg"
        className="bg-card w-full gap-3 [&_svg]:size-5"
        disabled={disabled}
        loading={busy}
        loadingText={t('opening')}
        onClick={() => void start()}
      >
        <GoogleMark />
        {t('continue')}
      </LoadingButton>
      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <Separator className="flex-1" />
        <span className="text-center">{t('emailAlternative')}</span>
        <Separator className="flex-1" />
      </div>
    </div>
  )
}
