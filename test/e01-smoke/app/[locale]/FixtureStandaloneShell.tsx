'use client'

import { Suspense, type ReactNode } from 'react'
import { StandaloneShellProvider } from '@/shared/layout/StandaloneShellContext'
import { StandaloneSidebar } from '@/shared/layout/StandaloneSidebar'
import { StandaloneTopBar } from '@/shared/layout/StandaloneTopBar'
import { ThemeProvider } from '@/shared/theme'
import { StandaloneToaster } from '@/shared/ui'

/**
 * The protected-route shell of `StandaloneLayout` without its auth guard: the
 * production sidebar and top bar around a fixture page, so sticky offsets and
 * fixed bars sit where they do in the app. The theme follows the system
 * setting, or the top bar toggle.
 */
export function FixtureStandaloneShell({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <ThemeProvider>
        <StandaloneShellProvider>
          <div className="akeed-app-canvas text-foreground flex min-h-screen">
            <StandaloneSidebar className="sticky top-0 hidden h-screen lg:flex" />
            <div className="flex min-w-0 flex-1 flex-col">
              <StandaloneTopBar onOpenNavigation={() => undefined} />
              <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
              <StandaloneToaster />
            </div>
          </div>
        </StandaloneShellProvider>
      </ThemeProvider>
    </Suspense>
  )
}
