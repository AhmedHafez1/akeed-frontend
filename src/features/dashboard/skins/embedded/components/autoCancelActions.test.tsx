import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationRowActions as EmbeddedActions } from './confirmations/ConfirmationRowActions'
import { renderEmbedded } from './embeddedTestUtils'
import { ConfirmationRowActions as StandaloneActions } from '@/features/dashboard/skins/standalone/components/confirmations/ConfirmationRowActions'
import { renderStandalone } from '@/features/dashboard/skins/standalone/components/shared/standaloneTestUtils'

for (const skin of ['embedded', 'standalone'] as const) {
  describe(skin + ' auto-cancel menu', () => {
    it.each([
      ['no_reply', false],
      ['no_reply', true],
      ['delivered', false],
      ['delivered', true],
    ] as const)(
      'shows the appropriate actions for %s (excluded=%s)',
      async (status, excluded) => {
        const row = {
          id: 'v1',
          status,
          customer_phone: null,
          capabilities: [{ action: 'auto_cancel_exclusion', supported: true }],
          auto_cancel: {
            state: 'projected',
            scheduled_for: null,
            reason: null,
            excluded,
            late_reply: false,
          },
        } as VerificationItem
        const props = {
          row,
          orderLabel: '#1197',
          canWrite: true,
          canRetry: false,
          isActing: false,
          handlers: {
            onOpenDetails: vi.fn(),
            onRequestConfirm: vi.fn(),
            onRequestCancel: vi.fn(),
            onRetry: vi.fn(),
            onToggleAutoCancel: vi.fn(),
          },
        }
        if (skin === 'embedded')
          renderEmbedded(<EmbeddedActions {...props} />, 'en')
        else
          renderStandalone(
            <StandaloneActions {...props} isAnyActing={false} />,
            'en'
          )
        if (skin === 'embedded') fireEvent.click(screen.getByRole('button'))
        else fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
        await screen.findByText('View details')
        if (status === 'no_reply') {
          expect(screen.queryByText('Allow auto-cancel')).toBeNull()
          expect(screen.queryByText('Don’t auto-cancel')).toBeNull()
        } else {
          expect(
            screen.getByText(
              excluded ? 'Allow auto-cancel' : 'Don’t auto-cancel'
            )
          ).toBeTruthy()
        }
      }
    )
  })
}
