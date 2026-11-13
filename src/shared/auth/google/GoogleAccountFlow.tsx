'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button, Card, Input, LoadingButton, SourceMark } from '@/shared/ui'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { SignupSourceStep } from '@/shared/auth/signup/SignupSourceStep'
import { AuthField } from '@/shared/auth/signup/AuthField'
import { GoogleMark } from './GoogleMark'
import { useGoogleAccount } from './useGoogleAccount'

export function GoogleAccountFlow() {
  const locale = getLocaleFromPathname(usePathname() ?? '')
  const t = useTranslations('auth.google')
  const signup = useTranslations('auth.signup')
  const controller = useGoogleAccount(locale)
  const { phase, account, values, fieldErrors, busy, failed } = controller
  const error = failed ? (
    <p
      role="alert"
      className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-control border p-3 text-sm"
    >
      {t('completionFailed')}
    </p>
  ) : null
  if (phase === 'checking')
    return (
      <Card className="rounded-panel bg-card mx-auto w-full max-w-xl p-6 sm:p-10">
        <p role="status" aria-live="polite">
          {t('checking')}
        </p>
      </Card>
    )
  if (phase === 'error')
    return (
      <Card className="rounded-panel bg-card mx-auto w-full max-w-xl space-y-6 p-6 sm:p-10">
        <h1 className="text-h2 text-foreground">{t('failedTitle')}</h1>
        <p role="alert" className="text-muted-foreground">
          {t('failed')}
        </p>
        {error}
        <div className="flex flex-col gap-3">
          <LoadingButton loading={busy} onClick={() => void controller.retry()}>
            {t('retry')}
          </LoadingButton>
          <LoadingButton
            variant="outline"
            loading={busy}
            onClick={() => void controller.signOut()}
          >
            {t('anotherAccount')}
          </LoadingButton>
        </div>
      </Card>
    )
  if (phase === 'source')
    return (
      <Card className="rounded-panel bg-card mx-auto w-full max-w-xl space-y-6 p-6 sm:p-10">
        <SignupSourceStep
          locale={locale}
          onSelectSource={controller.selectSource}
          hideAccountLink
        />
        {error}
        <LoadingButton
          variant="ghost"
          loading={busy}
          onClick={() => void controller.signOut()}
        >
          {t('anotherAccount')}
        </LoadingButton>
      </Card>
    )
  if (!account?.attempt.source) return null
  return (
    <Card
      variant="elevated"
      className="rounded-panel bg-card mx-auto w-full max-w-xl space-y-6 p-6 sm:p-10"
    >
      <header className="space-y-2">
        <h1 className="text-h2 text-foreground font-bold">{t('heading')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </header>
      <div className="border-border bg-muted rounded-control flex items-center gap-3 border px-4 py-3">
        <GoogleMark />
        <div className="min-w-0">
          <p className="break-all">
            <bdi dir="ltr">{account.user.email}</bdi>
          </p>
          <p className="text-muted-foreground text-sm">{t('connected')}</p>
        </div>
      </div>
      <div className="border-border rounded-control flex items-center gap-3 border px-4 py-3">
        <SourceMark sourceId={account.attempt.source} size="sm" />
        <p className="min-w-0 flex-1">
          <span className="text-muted-foreground block text-xs">
            {signup('source.summaryLabel')}
          </span>
          <span className="block text-sm font-semibold">
            {signup(`source.options.${account.attempt.source}.title`)}
          </span>
        </p>
        <Button
          variant="link"
          disabled={busy}
          onClick={controller.changeSource}
        >
          {signup('source.change')}
        </Button>
      </div>
      <form
        className="space-y-5"
        noValidate
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault()
          void controller.submit()
        }}
      >
        {error}
        <AuthField
          htmlFor="google-fullName"
          label={signup('fullName.label')}
          error={
            fieldErrors.fullName && signup(`errors.${fieldErrors.fullName}`)
          }
        >
          {({ describedBy }) => (
            <Input
              id="google-fullName"
              autoComplete="name"
              value={values.fullName}
              disabled={busy}
              onChange={(event) =>
                controller.setValue('fullName', event.target.value)
              }
              aria-invalid={!!fieldErrors.fullName}
              aria-describedby={describedBy}
              className="h-12"
            />
          )}
        </AuthField>
        <AuthField
          htmlFor="google-storeName"
          label={signup('storeName.label')}
          hint={signup('storeName.hint')}
          error={
            fieldErrors.storeName && signup(`errors.${fieldErrors.storeName}`)
          }
        >
          {({ describedBy }) => (
            <Input
              id="google-storeName"
              autoComplete="organization"
              maxLength={120}
              value={values.storeName}
              disabled={busy}
              onChange={(event) =>
                controller.setValue('storeName', event.target.value)
              }
              aria-invalid={!!fieldErrors.storeName}
              aria-describedby={describedBy}
              className="h-12"
            />
          )}
        </AuthField>
        <div className="space-y-2">
          <label
            className="text-foreground flex items-start gap-3 text-sm"
            htmlFor="google-terms"
          >
            <input
              id="google-terms"
              type="checkbox"
              checked={values.terms}
              disabled={busy}
              onChange={(event) =>
                controller.setValue('terms', event.target.checked)
              }
              aria-invalid={!!fieldErrors.terms}
              aria-describedby={
                fieldErrors.terms ? 'google-terms-error' : undefined
              }
              className="accent-primary focus-visible:ring-ring mt-0.5 size-5 shrink-0 focus-visible:ring-2"
            />
            <span>
              {signup.rich('terms', {
                terms: (chunks) => (
                  <Link
                    href={withLocale('/terms', locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link
                    href={withLocale('/privacy', locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {fieldErrors.terms && (
            <p
              id="google-terms-error"
              role="alert"
              className="text-ak-warning text-sm"
            >
              {signup(`errors.${fieldErrors.terms}`)}
            </p>
          )}
        </div>
        <LoadingButton
          type="submit"
          size="lg"
          className="w-full"
          loading={busy}
          loadingText={t('saving')}
        >
          {t('complete')}
        </LoadingButton>
        <Button
          type="button"
          variant="link"
          className="w-full"
          disabled={busy}
          onClick={() => void controller.signOut()}
        >
          {t('anotherAccount')}
        </Button>
      </form>
    </Card>
  )
}
