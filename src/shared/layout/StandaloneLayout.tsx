'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { isAuthRoute, isPublicRoute } from '@/shared/lib/locale'
import { WhatsAppButton } from '@/shared/ui/WhatsAppButton'
import { AppHeader } from './AppHeader'
import { Footer } from './Footer'
import { Header } from './Header'
import { AuthGuard } from '../auth/AuthGuard'
import { AuthLayout } from './AuthLayout'

interface StandaloneLayoutProps {
  children: ReactNode
}

/**
 * Standalone Mode Layout - Custom SaaS UI
 *
 * Three-way branch:
 *  1. Auth routes (login, signup, forgot-password, reset-password) → AuthLayout
 *  2. Public routes (landing, terms, privacy, support) → marketing Header, no auth guard
 *  3. Protected routes (dashboard, etc.) → AppHeader + AuthGuard
 */
export function StandaloneLayout({ children }: StandaloneLayoutProps) {
  const pathname = usePathname()
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
    return <AuthGuard>{children}</AuthGuard>
  }

  // 3. Protected routes — auth required
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
          <WhatsAppButton />
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
      </div>
    </AuthGuard>
  )
}
