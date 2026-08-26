import type { Metadata } from 'next'
import { AdminAccessGate } from '@/features/admin/AdminAccessGate'
import { AdminShell } from '@/features/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Admin Control Tower',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="ltr" lang="en">
      <AdminAccessGate>
        <AdminShell>{children}</AdminShell>
      </AdminAccessGate>
    </div>
  )
}
