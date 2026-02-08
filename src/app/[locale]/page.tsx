import { HomePage } from '@/components/pages/HomePage'
import { EmbeddedAuthGate } from '@/components/auth/EmbeddedAuthGate'

export default function Home() {
  return (
    <EmbeddedAuthGate fallback={<></>}>
      <HomePage />
    </EmbeddedAuthGate>
  )
}
