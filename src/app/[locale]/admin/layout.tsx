import type { Metadata } from 'next'
import { AdminAccessGate } from '@/features/admin/AdminAccessGate'
import { AdminShell } from '@/features/admin/AdminShell'

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
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
      <AdminAccessGate>
        <AdminShell>{children}</AdminShell>
      </AdminAccessGate>
    </div>
  )
}
