'use client'

import { Suspense, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CircleHelp, Languages, LogOut, Menu } from 'lucide-react'
import {
  resolveOnboardingProgress,
  STANDALONE_TOTAL_STEPS,
  useOnboardingSourceSkin,
} from '@/features/onboarding'
import { auth } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  withLocale,
} from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Stepper,
  StepperCompact,
  type StepperStep,
} from '@/shared/ui'
import { AkeedLogo } from './AkeedLogo'

const logger = createLogger('Auth')

interface StandaloneOnboardingShellProps {
  children: ReactNode
  /**
   * Signed up but the email is not confirmed yet: the account step is the
   * current one and there is no session, so there is nothing to sign out of.
   */
  accountPending?: boolean
}

/**
 * Focused shell for standalone setup.
 *
 * While onboarding is incomplete every protected destination redirects back
 * here, so the full sidebar shell is replaced by a slim bar: the Akeed mark
 * at the start, the setup stepper in the centre, and language, Help and sign
 * out at the end. Where the stepper would not fit it becomes one line of
 * text over a thin progress bar, and below 640px the three actions move into
 * a menu. The logo is deliberately not a link.
 */
export function StandaloneOnboardingShell({
  children,
  accountPending = false,
}: StandaloneOnboardingShellProps) {
  const t = useTranslations('standaloneOnboarding')
  const tHeader = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await auth.signOut()
      router.push(auth.getLoginPath(locale))
    } catch (error) {
      logger.error('Sign out failed', error)
      setIsSigningOut(false)
    }
  }

  const handleLocaleChange = () => {
    const nextLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
    persistLocalePreference(nextLocale)
    const segments = pathname.split('/')
    if (segments.length > 1) {
      segments[1] = nextLocale
      // Keep ?step (and signup's ?sent&email) so the same screen reopens.
      router.push(`${segments.join('/') || '/'}${window.location.search}`)
    }
  }

  const localeLabel = locale === 'ar' ? 'English' : 'العربية'
  const signOutLabel = isSigningOut ? tHeader('signingOut') : tHeader('signOut')

  return (
    <div className="akeed-app-canvas text-foreground flex min-h-screen flex-col">
      <a
        href="#onboarding-content"
        className="focus:bg-card focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2"
      >
        {t('shell.skipToContent')}
      </a>

      <header className="border-border bg-card relative grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 sm:px-6">
        <AkeedLogo className="h-9" />

        <div className="flex min-w-0 justify-start sm:justify-center">
          {accountPending ? (
            <AccountPendingProgress />
          ) : (
            <Suspense fallback={null}>
              <OnboardingProgress />
            </Suspense>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-2">
          <button
            type="button"
            onClick={handleLocaleChange}
            className="hover:bg-muted text-foreground/80 focus-visible:ring-ring inline-flex h-9 items-center rounded-lg px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            suppressHydrationWarning
          >
            {localeLabel}
          </button>
          <Link
            href={withLocale('/support', locale)}
            target="_blank"
            rel="noreferrer"
            className="hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <CircleHelp aria-hidden="true" className="h-[18px] w-[18px]" />
            <span className="sr-only lg:not-sr-only">{t('shell.help')}</span>
          </Link>
          {!accountPending && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="hover:bg-muted text-foreground/70 hover:text-destructive focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
            >
              <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
              <span className="sr-only lg:not-sr-only">{signOutLabel}</span>
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('flow.menu')}
              className="text-primary hover:bg-muted focus-visible:ring-ring inline-flex size-11 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none sm:hidden"
            >
              <Menu aria-hidden="true" className="size-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem onSelect={handleLocaleChange}>
              <Languages aria-hidden="true" />
              {localeLabel}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={withLocale('/support', locale)}
                target="_blank"
                rel="noreferrer"
              >
                <CircleHelp aria-hidden="true" />
                {t('shell.help')}
              </Link>
            </DropdownMenuItem>
            {!accountPending && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isSigningOut}
                  onSelect={() => void handleSignOut()}
                >
                  <LogOut aria-hidden="true" />
                  {signOutLabel}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main
        id="onboarding-content"
        className="flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {children}
      </main>
    </div>
  )
}

/** Before the email is confirmed: step 1 of 3, the account, is current. */
function AccountPendingProgress() {
  const t = useTranslations('standaloneOnboarding.flow')
  const steps: StepperStep[] = [
    { id: 'account', title: t('account'), state: 'current' },
    { id: 'store', title: t('store'), state: 'upcoming' },
    { id: 'test', title: t('test'), state: 'upcoming' },
  ]

  return (
    <>
      <Stepper
        steps={steps}
        label={t('label')}
        completedLabel={t('completed')}
        className="hidden sm:block"
      />
      <StepperCompact
        className="sm:hidden"
        progress={1 / STANDALONE_TOTAL_STEPS}
        progressLabel={t('compact', {
          current: 1,
          total: STANDALONE_TOTAL_STEPS,
          title: t('account'),
        })}
      />
    </>
  )
}

/** The widest setup the bar can name in full from 640px up. */
const FULL_STEPPER_MAX_STEPS = 3

/**
 * The setup steps of the source being set up, driven by the page's `?step`.
 * Three steps fit the bar by name. A longer setup names only the step on
 * screen until the bar is wide enough for all of them, and uses the one-line
 * form a little longer on small screens.
 */
function OnboardingProgress() {
  const t = useTranslations('standaloneOnboarding.flow')
  const searchParams = useSearchParams()
  const progress = resolveOnboardingProgress(
    useOnboardingSourceSkin(),
    searchParams?.get('step')
  )
  const steps: StepperStep[] = progress.steps.map((step) => ({
    id: step.id,
    title: t(step.titleKey),
    state: step.state,
  }))
  const isLong = steps.length > FULL_STEPPER_MAX_STEPS

  return (
    <>
      <Stepper
        steps={steps}
        label={t('label')}
        completedLabel={t('completed')}
        className={isLong ? 'hidden 2xl:block' : 'hidden sm:block'}
      />
      {isLong && (
        <Stepper
          steps={steps}
          label={t('label')}
          completedLabel={t('completed')}
          titles="current"
          className="hidden md:block 2xl:hidden"
        />
      )}
      <StepperCompact
        className={isLong ? 'md:hidden' : 'sm:hidden'}
        progress={progress.fraction}
        progressLabel={t('compact', {
          current: progress.current,
          total: progress.total,
          title: t(progress.titleKey),
        })}
      />
    </>
  )
}
