'use client'

import { WhatsappConnectFlow } from '@/features/whatsapp-connect'

/**
 * Connecting a merchant's own WhatsApp number, opened in its own tab from
 * settings in both standalone and Shopify. It needs no session: the one-time
 * ticket in the link is its only credential. The card carries Akeed's mark,
 * so the page has no header, and no language switch, because changing the
 * route would drop the ticket held in memory.
 */
export default function WhatsappConnectPage() {
  return (
    <main className="auth-surface text-foreground flex min-h-dvh justify-center px-4 py-8 sm:px-6 sm:py-14">
      <div className="w-full max-w-xl">
        <WhatsappConnectFlow />
      </div>
    </main>
  )
}
