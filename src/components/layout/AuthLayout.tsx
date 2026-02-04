'use client'

import type { ReactNode } from 'react'
import { Header } from './Header'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex min-h-screen pt-20">
        <div className="flex flex-1 flex-col">
          <main className="flex flex-1 items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
