'use client'

import { WhatsappConnectFlow } from '@/features/whatsapp-connect'

/**
 * The connect page with a stand-in for Meta's SDK: no script leaves the
 * process. `?fb=cancel` closes the window without a code; otherwise Meta
 * answers with a code. Its session message would come from a page origin, so
 * the flow ignores it as untrusted and submits after the short wait, which
 * also exercises that path. The settings entry lives in the WhatsApp tab.
 */
function installFakeFacebook(mode: string | null) {
  window.FB = {
    init: () => undefined,
    login: (callback) => {
      window.setTimeout(
        () =>
          callback(
            mode === 'cancel'
              ? { status: 'unknown' }
              : { authResponse: { code: 'fixture-login-code' } }
          ),
        900
      )
    },
  }
}

// Before any effect: the flow's SDK loader finds it already there.
if (typeof window !== 'undefined')
  installFakeFacebook(new URLSearchParams(window.location.search).get('fb'))

export default function WhatsappConnectFixture() {
  return (
    <main className="auth-surface text-foreground flex min-h-dvh justify-center px-4 py-8 sm:px-6 sm:py-14">
      <div className="w-full max-w-xl">
        <WhatsappConnectFlow />
      </div>
    </main>
  )
}
