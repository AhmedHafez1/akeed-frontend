'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { auth } from '@/shared/lib/auth'
import {
  clearGoogleAttempt,
  finishGoogleSignIn,
  readGoogleAttempt,
  saveGoogleAttempt,
  startGoogleSignIn,
  type GoogleAttempt,
} from '@/shared/lib/googleOAuth'
import type { SupportedLocale } from '@/shared/lib/locale'
import { parseSignupSourceParam } from '@/shared/config/commerceSources'
import {
  firstInvalidField,
  type SignupFieldErrors,
} from '@/shared/auth/signup/signup.model'
import {
  completeGoogleAccount,
  hasGoogleOrganization,
  reportGoogleRegistration,
  validateGoogleAccount,
  type GoogleAccountValues,
} from './googleAccount'

export function useGoogleAccount(locale: SupportedLocale) {
  const router = useRouter()
  const generation = useRef(0)
  const recoveryAttempt = useRef<GoogleAttempt | null>(null)
  const [phase, setPhase] = useState<
    'checking' | 'source' | 'details' | 'error'
  >('checking')
  const [account, setAccount] = useState<{
    user: User
    attempt: GoogleAttempt
  } | null>(null)
  const [values, setValues] = useState<GoogleAccountValues>({
    fullName: '',
    storeName: '',
    terms: false,
  })
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  const navigate = useCallback(
    (attempt: GoogleAttempt, existing: boolean) => {
      clearGoogleAttempt()
      router.replace(
        existing
          ? (attempt.returnTo ?? auth.getDashboardPath(attempt.locale))
          : auth.getOnboardingPath(attempt.locale)
      )
    },
    [router]
  )

  const load = useCallback(async () => {
    const current = ++generation.current
    const pending = readGoogleAttempt()
    if (pending) recoveryAttempt.current = pending
    setPhase('checking')
    try {
      const result = await finishGoogleSignIn()
      if (current !== generation.current) return
      const existing = await hasGoogleOrganization()
      if (current !== generation.current) return
      if (existing) {
        reportGoogleRegistration(result.user, result.attempt)
        navigate(result.attempt, true)
        return
      }
      setAccount(result)
      setValues({
        fullName:
          typeof result.user.user_metadata?.full_name === 'string'
            ? result.user.user_metadata.full_name
            : '',
        storeName:
          typeof result.user.user_metadata?.company_name === 'string'
            ? result.user.user_metadata.company_name
            : '',
        terms: false,
      })
      setPhase(result.attempt.source ? 'details' : 'source')
    } catch {
      if (current !== generation.current) return
      console.warn('[Auth] Google account preparation failed')
      setPhase('error')
    }
  }, [navigate])

  const retry = async () => {
    if (busy) return
    if (readGoogleAttempt()?.userId) return load()
    setBusy(true)
    setFailed(false)
    try {
      const previous = recoveryAttempt.current
      window.location.assign(
        await startGoogleSignIn({
          locale,
          intent: previous?.intent ?? 'login',
          source: previous?.source,
          returnTo: previous?.returnTo,
        })
      )
    } catch {
      console.warn('[Auth] Google sign-in retry failed')
      setFailed(true)
      setBusy(false)
    }
  }

  useEffect(() => {
    const counter = generation
    void load()
    return () => {
      counter.current++
    }
  }, [load])

  const selectSource = (value: string) => {
    const source = parseSignupSourceParam(value)
    if (!account || !source) return
    const attempt = { ...account.attempt, source }
    try {
      saveGoogleAttempt(attempt)
      setAccount({ ...account, attempt })
      setPhase('details')
      requestAnimationFrame(() =>
        document.getElementById('google-fullName')?.focus()
      )
    } catch {
      setPhase('error')
    }
  }

  const submit = async () => {
    if (!account || busy) return
    const errors = validateGoogleAccount(values)
    setFieldErrors(errors)
    const invalid = firstInvalidField(errors)
    if (invalid) {
      document.getElementById(`google-${invalid}`)?.focus()
      return
    }
    if (!parseSignupSourceParam(account.attempt.source)) {
      setPhase('source')
      return
    }
    setBusy(true)
    setFailed(false)
    try {
      const existing = await completeGoogleAccount(
        account.user,
        account.attempt,
        values
      )
      navigate(account.attempt, existing)
    } catch {
      console.warn('[Auth] Google account completion failed')
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    if (busy) return
    setBusy(true)
    try {
      await auth.signOut()
      clearGoogleAttempt()
      router.replace(auth.getLoginPath(locale))
    } catch {
      console.warn('[Auth] Google account sign-out failed')
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const setValue = <K extends keyof GoogleAccountValues>(
    key: K,
    value: GoogleAccountValues[K]
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }))
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  return {
    phase,
    account,
    values,
    fieldErrors,
    failed,
    busy,
    load,
    retry,
    selectSource,
    submit,
    signOut,
    setValue,
    changeSource: () => setPhase('source'),
  }
}
