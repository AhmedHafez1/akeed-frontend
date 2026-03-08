'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { isAuthRoute } from '@/shared/lib/locale'
import { Header } from './Header'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { Toaster } from 'react-hot-toast'
import { AuthGuard } from '../auth/AuthGuard'
import { AuthLayout } from './AuthLayout'

interface StandaloneLayoutProps {
  children: ReactNode
}

/**
 * Standalone Mode Layout - Custom SaaS UI
 */
export function StandaloneLayout({ children }: StandaloneLayoutProps) {
  const pathname = usePathname()
  const isOnAuthRoute = isAuthRoute(pathname)

  if (isOnAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
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
