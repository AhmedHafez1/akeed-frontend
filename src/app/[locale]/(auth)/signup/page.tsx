'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { AuthFrame } from '@/shared/layout/AuthLayout'
import { StandaloneOnboardingShell } from '@/shared/layout/StandaloneOnboardingShell'
import { SignupBenefits } from '@/shared/auth/signup/SignupBenefits'
import { SignupForm } from '@/shared/auth/signup/SignupForm'
import { SignupSourceStep } from '@/shared/auth/signup/SignupSourceStep'
import { VerifyEmailCard } from '@/shared/auth/signup/VerifyEmailCard'
import {
  buildSentSearch,
  buildSourceSearch,
  readSentEmail,
  readSignupSource,
  type SignupField,
} from '@/shared/auth/signup/signup.model'
import { useSignup } from '@/shared/auth/signup/useSignup'
import { Card } from '@/shared/ui'

const SIGNUP_STEPS = 2

/**
 * Signup - standalone mode only.
 *
 * Three states on one route, all read from the URL: where the orders come
 * from (no `?source=`), the account form for that source (`?source=<id>`),
 * and "open your inbox" once Supabase has sent the confirmation link
 * (`?sent=1&email=…`). A refresh keeps each of them; the password is never in
 * the URL.
 */
export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFrame>{null}</AuthFrame>}>
      <SignupFlow />
    </Suspense>
  )
}

function SignupFlow() {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname)
  const t = useTranslations('auth.signup')
  const sentEmail = searchParams ? readSentEmail(searchParams) : null
  const source = searchParams ? readSignupSource(searchParams) : null

  const handleEmailSent = useCallback(
    (email: string) =>
      router.replace(`${pathname}${buildSentSearch(email, source)}`),
    [pathname, router, source]
  )
  const handleSignedIn = useCallback(
    () => router.push(auth.getOnboardingPath(locale)),
    [locale, router]
  )

  const signup = useSignup({
    locale,
    onEmailSent: handleEmailSent,
    onSignedIn: handleSignedIn,
  })
  const { setValue } = signup
  const [focusOnReturn, setFocusOnReturn] = useState<SignupField | null>(null)

  // After a refresh the form state is gone; the URL still knows the email.
  useEffect(() => {
    if (sentEmail) setValue('email', sentEmail)
  }, [sentEmail, setValue])

  // The source is chosen by the URL, never inside the form.
  useEffect(() => {
    if (source) setValue('source', source)
  }, [source, setValue])

  if (sentEmail) {
    return (
      <StandaloneOnboardingShell accountPending>
        <div className="px-4 py-10 sm:px-6 sm:py-16">
          <VerifyEmailCard
            key={sentEmail}
            email={sentEmail}
            locale={locale}
            onChangeEmail={() => {
              setFocusOnReturn('email')
              router.replace(
                source ? `${pathname}${buildSourceSearch(source)}` : pathname
              )
            }}
          />
        </div>
      </StandaloneOnboardingShell>
    )
  }

  const stepLabel = (current: number) => (
    <p className="text-ink-muted text-start text-sm font-semibold">
      {t('step', { current, total: SIGNUP_STEPS })}
    </p>
  )

  if (!source) {
    return (
      <AuthFrame>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {stepLabel(1)}
          <Card
            variant="elevated"
            className="rounded-panel bg-card w-full p-6 sm:p-10"
          >
            <SignupSourceStep locale={locale} />
          </Card>
        </div>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,36rem)_minmax(0,22rem)] lg:justify-center xl:gap-16">
        <div className="mx-auto w-full max-w-xl space-y-4">
          {stepLabel(2)}
          <Card
            variant="elevated"
            className="rounded-panel bg-card w-full p-6 sm:p-10"
          >
            <SignupForm
              signup={signup}
              locale={locale}
              sourceId={source}
              initialFocus={focusOnReturn}
            />
          </Card>
        </div>
        <div className="hidden pt-17 lg:block">
          <SignupBenefits locale={locale} sourceId={source} />
        </div>
      </div>
    </AuthFrame>
  )
}
