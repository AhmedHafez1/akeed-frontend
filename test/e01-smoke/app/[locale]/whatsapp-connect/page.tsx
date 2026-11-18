'use client'

import { WhatsappConnectFlow } from '@/features/whatsapp-connect'

/** Real connect flow over local synthetic claim/completion endpoints. */

export default function WhatsappConnectFixture() {
  return (
    <main className="auth-surface text-foreground flex min-h-dvh justify-center px-4 py-8 sm:px-6 sm:py-14">
      <div className="w-full max-w-xl">
        <WhatsappConnectFlow />
      </div>
    </main>
  )
}
