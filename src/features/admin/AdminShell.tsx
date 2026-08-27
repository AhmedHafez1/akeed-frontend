'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, LogOut, Store } from 'lucide-react'
import { auth } from '@/shared/lib/auth'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'

interface AdminShellProps {
  children: React.ReactNode
}

const navigation = [
  { href: '/en/admin/stores', label: 'Stores', icon: Store },
  { href: '/en/admin/funnel', label: 'Funnel', icon: BarChart3 },
]

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await auth.signOut()
    router.push('/en/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950" dir="ltr">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-5 lg:px-8">
          <Link href="/en/admin/stores" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 font-bold text-white">
              A
            </span>
            <span>
              <span className="block text-sm font-semibold">Akeed Admin</span>
              <span className="block text-[11px] text-slate-500">
                Control tower
              </span>
            </span>
          </Link>
          <nav className="flex flex-1 items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] p-5 lg:p-8">{children}</main>
    </div>
  )
}
