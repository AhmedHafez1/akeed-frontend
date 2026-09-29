'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { AuthFrame } from '@/shared/layout/AuthLayout'
import { StandaloneOnboardingShell } from '@/shared/layout/StandaloneOnboardingShell'
import { SignupBenefits } from '@/shared/auth/signup/SignupBenefits'
import { SignupForm } from '@/shared/auth/signup/SignupForm'
import { VerifyEmailCard } from '@/shared/auth/signup/VerifyEmailCard'
import {
  buildSentSearch,
  readSentEmail,
  type SignupField,
} from '@/shared/auth/signup/signup.model'
import { useSignup } from '@/shared/auth/signup/useSignup'
import { Card } from '@/shared/ui'

/**
 * Signup - standalone mode only.
 *
 * Two states on one route: the form, and "open your inbox" once Supabase has
 * sent the confirmation link. The second is kept in the URL
 * (`?sent=1&email=…`) so a refresh keeps it; the password never is.
 */
export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFrame surface="app">{null}</AuthFrame>}>
      <SignupFlow />
    </Suspense>
  )
}

function SignupFlow() {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname)
  const sentEmail = searchParams ? readSentEmail(searchParams) : null

  const handleEmailSent = useCallback(
    (email: string) => router.replace(`${pathname}${buildSentSearch(email)}`),
    [pathname, router]
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
              router.replace(pathname)
            }}
          />
        </div>
      </StandaloneOnboardingShell>
    )
  }

  return (
    <AuthFrame surface="app">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,36rem)_minmax(0,22rem)] lg:justify-center xl:gap-16">
        <Card
          variant="elevated"
          className="rounded-panel bg-card mx-auto w-full max-w-xl p-6 sm:p-10"
        >
          <SignupForm
            signup={signup}
            locale={locale}
            initialFocus={focusOnReturn}
          />
        </Card>
        <div className="hidden pt-8 lg:block">
          <SignupBenefits locale={locale} />
        </div>
      </div>
    </AuthFrame>
  )
}
