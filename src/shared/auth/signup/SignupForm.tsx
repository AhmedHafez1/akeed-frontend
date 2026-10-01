'use client'

import { useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Input, LoadingButton, Separator } from '@/shared/ui'
import { PasswordInput } from '../PasswordInput'
import { ShopifyContinueLink } from '../ShopifyContinueLink'
import { AUTH_WARNING_FIELD, AuthField } from './AuthField'
import {
  SIGNUP_FIELD_IDS,
  SIGNUP_STORE_NAME_MAX_LENGTH,
  type SignupField,
} from './signup.model'
import type { SignupController } from './useSignup'

interface SignupFormProps {
  signup: SignupController
  locale: string
  /** Field to focus on mount, e.g. email after "Change email". */
  initialFocus?: SignupField | null
}

const LINK_CLASS =
  'text-primary hover:text-primary-hover font-semibold underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'

function focusField(field: SignupField) {
  document.getElementById(SIGNUP_FIELD_IDS[field])?.focus()
}

/**
 * Four fields and the terms: name, store name, email, password. The store
 * name is the one reused later, in the confirmation message and the setup
 * step, so its hint says where customers will see it.
 */
export function SignupForm({
  signup,
  locale,
  initialFocus = null,
}: SignupFormProps) {
  const t = useTranslations('auth.signup')

  useEffect(() => {
    if (initialFocus) focusField(initialFocus)
  }, [initialFocus])
  const { values, fieldErrors, formError, isSubmitting, setValue } = signup
  const loginPath = auth.getLoginPath(locale)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const invalid = await signup.submit()
    if (invalid) focusField(invalid)
  }

  const errorText = (field: SignupField) => {
    const code = fieldErrors[field]
    if (!code) return undefined
    if (code === 'emailRegistered') {
      return t.rich('errors.emailRegistered', {
        link: (chunks) => (
          <Link href={loginPath} className={LINK_CLASS}>
            {chunks}
          </Link>
        ),
      })
    }
    return t(`errors.${code}`)
  }

  const warn = (field: SignupField) =>
    cn('rounded-control bg-card h-12', fieldErrors[field] && AUTH_WARNING_FIELD)

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-start">
        <h1 className="text-ink text-h2 font-bold">{t('heading')}</h1>
      </header>

      <form
        className="space-y-5"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        aria-busy={isSubmitting}
      >
        {formError && (
          <div
            role="alert"
            className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-panel flex items-start gap-2 border p-4 text-sm"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {t(`errors.${formError}`)}
          </div>
        )}

        <AuthField
          htmlFor={SIGNUP_FIELD_IDS.fullName}
          label={t('fullName.label')}
          error={errorText('fullName')}
        >
          {({ describedBy }) => (
            <Input
              id={SIGNUP_FIELD_IDS.fullName}
              name="fullName"
              autoComplete="name"
              value={values.fullName}
              onChange={(event) => setValue('fullName', event.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={describedBy}
              className={warn('fullName')}
            />
          )}
        </AuthField>

        <AuthField
          htmlFor={SIGNUP_FIELD_IDS.storeName}
          label={t('storeName.label')}
          hint={t('storeName.hint')}
          error={errorText('storeName')}
        >
          {({ describedBy }) => (
            <Input
              id={SIGNUP_FIELD_IDS.storeName}
              name="storeName"
              autoComplete="organization"
              maxLength={SIGNUP_STORE_NAME_MAX_LENGTH}
              value={values.storeName}
              onChange={(event) => setValue('storeName', event.target.value)}
              aria-invalid={Boolean(fieldErrors.storeName)}
              aria-describedby={describedBy}
              className={warn('storeName')}
            />
          )}
        </AuthField>

        <AuthField
          htmlFor={SIGNUP_FIELD_IDS.email}
          label={t('email.label')}
          error={errorText('email')}
        >
          {({ describedBy }) => (
            <Input
              id={SIGNUP_FIELD_IDS.email}
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setValue('email', event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy}
              className={cn(warn('email'), 'text-start')}
            />
          )}
        </AuthField>

        <AuthField
          htmlFor={SIGNUP_FIELD_IDS.password}
          label={t('password.label')}
          hint={t('password.hint')}
          error={errorText('password')}
        >
          {({ describedBy }) => (
            <PasswordInput
              id={SIGNUP_FIELD_IDS.password}
              name="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => setValue('password', event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={describedBy}
              className={warn('password')}
            />
          )}
        </AuthField>

        <div className="space-y-2">
          <label
            htmlFor={SIGNUP_FIELD_IDS.terms}
            className="text-ink flex items-start gap-3 text-sm"
          >
            <input
              id={SIGNUP_FIELD_IDS.terms}
              name="terms"
              type="checkbox"
              checked={values.terms}
              onChange={(event) => setValue('terms', event.target.checked)}
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={
                fieldErrors.terms
                  ? `${SIGNUP_FIELD_IDS.terms}-error`
                  : undefined
              }
              className="accent-primary focus-visible:ring-ring mt-0.5 size-5 shrink-0 rounded focus-visible:ring-2"
            />
            <span>
              {t.rich('terms', {
                terms: (chunks) => (
                  <Link
                    href={withLocale('/terms', locale)}
                    target="_blank"
                    className={LINK_CLASS}
                  >
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link
                    href={withLocale('/privacy', locale)}
                    target="_blank"
                    className={LINK_CLASS}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {fieldErrors.terms && (
            <p
              id={`${SIGNUP_FIELD_IDS.terms}-error`}
              className="text-ak-warning flex items-start gap-1.5 text-sm font-medium"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {errorText('terms')}
            </p>
          )}
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="w-full px-8 font-semibold sm:w-auto"
          loading={isSubmitting}
          loadingText={t('submitting')}
        >
          {t('submit')}
        </LoadingButton>

        <p className="text-ink-muted text-center text-sm">
          {t('haveAccount')}{' '}
          <Link href={loginPath} className={LINK_CLASS}>
            {t('signIn')}
          </Link>
        </p>
      </form>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-ink-muted text-sm">{t('shopifyDivider')}</span>
          <Separator className="flex-1" />
        </div>
        <ShopifyContinueLink>{t('shopifyCta')}</ShopifyContinueLink>
      </div>
    </div>
  )
}
