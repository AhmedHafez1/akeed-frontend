import { HomePage } from '@/components/pages/HomePage'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { EmbeddedAuthGate } from '@/components/auth/EmbeddedAuthGate'

export default function Home() {
  return (
    <EmbeddedAuthGate fallback={<FullPageLoader />}>
      <HomePage />
    </EmbeddedAuthGate>
  )
}
