'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Toaster } from 'react-hot-toast'
import { isAuthRoute, isPublicRoute } from '@/shared/lib/locale'
import { WhatsAppButton } from '@/shared/ui/WhatsAppButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui'
import { Footer } from './Footer'
import { Header } from './Header'
import { AuthGuard } from '../auth/AuthGuard'
import { AuthLayout } from './AuthLayout'
import { StandaloneShellProvider } from './StandaloneShellContext'
import { StandaloneSidebar } from './StandaloneSidebar'
import { StandaloneTopBar } from './StandaloneTopBar'

interface StandaloneLayoutProps {
  children: ReactNode
}

/**
 * Standalone Mode Layout - Custom SaaS UI
 *
 * Three-way branch:
 *  1. Auth routes (login, signup, forgot-password, reset-password) → AuthLayout
 *  2. Public routes (landing, terms, privacy, support) → marketing Header, no auth guard
 *  3. Protected routes (dashboard, etc.) → standalone sidebar shell + AuthGuard
 */
export function StandaloneLayout({ children }: StandaloneLayoutProps) {
  const pathname = usePathname()
  const t = useTranslations('appHeader')
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const publicPath = pathname
    ? `/${pathname.split('/').slice(2).join('/')}`
    : ''
  const isLandingPage = publicPath === '/'
  const isAdminRoute =
    publicPath === '/admin' || publicPath.startsWith('/admin/')

  // 1. Auth routes — minimal auth page shell
  if (isAuthRoute(pathname)) {
    return <AuthLayout>{children}</AuthLayout>
  }

  // 2. Public marketing routes — no auth required
  if (isPublicRoute(pathname)) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {isLandingPage && <WhatsAppButton offsetForMobileCta />}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    )
  }

  if (isAdminRoute) {
    return <AuthGuard requireOrganization={false}>{children}</AuthGuard>
  }

  // 3. Protected routes — auth required
  return (
    <AuthGuard>
      <StandaloneShellProvider>
        <div className="flex min-h-screen bg-[#f7f7f3] text-slate-950">
          <StandaloneSidebar className="sticky top-0 hidden h-screen lg:flex" />
          <div className="flex min-w-0 flex-1 flex-col">
            <StandaloneTopBar
              onOpenNavigation={() => setIsNavigationOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            <WhatsAppButton />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                },
              }}
            />
          </div>

          <Dialog open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
            <DialogContent
              closeLabel={t('closeNavigation')}
              className="!inset-y-0 [inset-inline-start:0] [inset-inline-end:auto] !top-0 !left-auto block !h-dvh !w-[min(88vw,320px)] !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !p-0"
            >
              <DialogTitle className="sr-only">
                {t('primaryNavigation')}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t('navigationDescription')}
              </DialogDescription>
              <StandaloneSidebar
                className="w-full"
                onNavigate={() => setIsNavigationOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </StandaloneShellProvider>
    </AuthGuard>
  )
}
