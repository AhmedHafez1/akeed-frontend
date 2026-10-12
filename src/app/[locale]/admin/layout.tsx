import type { Metadata } from 'next'
import { AdminAccessGate } from '@/features/admin/AdminAccessGate'
import { AdminShell } from '@/features/admin/AdminShell'
import { getLocaleDirection } from '@/shared/lib/locale'

export const metadata: Metadata = {
  title: 'Admin Control Tower',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <div dir={getLocaleDirection(locale)} lang={locale}>
      <AdminAccessGate>
        <AdminShell>{children}</AdminShell>
      </AdminAccessGate>
    </div>
  )
}
