'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
      {/* Minimal header with logo */}
      <header className="flex h-16 shrink-0 items-center px-6">
        <Link
          href={withLocale('/', locale)}
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Image
            src="/images/akeed-web-logo-horizontal.png"
            alt="Akeed"
            width={48}
            height={48}
            className="object-contain"
          />
        </Link>
      </header>

      {/* Centered form area */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
