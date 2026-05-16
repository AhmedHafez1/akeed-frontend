import type { ReactNode } from 'react'
import { noIndexMetadata } from '@/shared/lib/seo'

export const metadata = noIndexMetadata

export default function AutomationSettingsRoutesLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
