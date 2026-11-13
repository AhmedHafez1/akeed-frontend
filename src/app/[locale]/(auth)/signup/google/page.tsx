import type { Metadata } from 'next'
import { AuthFrame } from '@/shared/layout/AuthLayout'
import { GoogleAccountFlow } from '@/shared/auth/google/GoogleAccountFlow'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function GoogleAccountPage() {
  return (
    <AuthFrame>
      <GoogleAccountFlow />
    </AuthFrame>
  )
}
