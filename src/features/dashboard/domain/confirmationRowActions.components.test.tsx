import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import { ConfirmationRowActions as EmbeddedActions } from '@/features/dashboard/skins/embedded/components/confirmations/ConfirmationRowActions'
import { ConfirmationRowActions as StandaloneActions } from '@/features/dashboard/skins/standalone/components/confirmations/ConfirmationRowActions'
import { renderStandalone } from '@/features/dashboard/skins/standalone/components/shared/standaloneTestUtils'

const requestRow: VerificationItem = {
  id: 'verification-1',
  status: 'read',
  is_test: false,
  reason: null,
  order_id: 'order-1',
  order_number: '1187',
  customer_name: 'Mona',
  customer_phone: '+201001234567',
  total_price: '750.00',
  currency: 'EGP',
  created_at: null,
  last_sent_at: null,
  delivered_at: null,
  read_at: null,
  confirmed_at: null,
  canceled_at: null,
  expired_at: null,
  no_reply_at: null,
  follow_up_attempts: 0,
  follow_up_sent_at: null,
  change_request: {
    id: 'request-1',
    opened_at: '2026-11-08T10:00:00.000Z',
    confirmation_cycle: 1,
    acknowledgment: { status: 'done', reason: null },
    reconfirmation: { state: null, scheduled_for: null, last_error: null },
  },
}

beforeEach(() => {
  // Polaris restores the scroll position when its modal closes.
  vi.spyOn(window, 'scroll').mockImplementation(() => undefined)
})

for (const skin of ['embedded', 'standalone'] as const) {
  for (const layout of ['inline', 'stacked'] as const) {
    describe.each([
      ['en', en.dashboard],
      ['ar', ar.dashboard],
    ] as const)(`${skin} ${layout} request actions (%s)`, (locale, t) => {
      function renderActions({
        row = requestRow,
        isActing = false,
        canWrite = true,
      } = {}) {
        const handlers = {
          onOpenDetails: vi.fn(),
          onRequestConfirm: vi.fn(),
          onRequestCancel: vi.fn(),
          onRetry: vi.fn(),
          onToggleAutoCancel: vi.fn(),
        }
        const props = {
          row,
          orderLabel: '#1187',
          canWrite,
          canRetry: canWrite,
          isActing,
          handlers,
          layout,
        }
        if (skin === 'embedded')
          renderEmbedded(<EmbeddedActions {...props} />, locale)
        else
          renderStandalone(
            <StandaloneActions {...props} isAnyActing={isActing} />,
            locale
          )
        return handlers
      }

      it('opens the correct request in one click without a menu or contact shortcut', () => {
        const handlers = renderActions()
        const trigger = screen.getByRole('button', {
          name: `${t.changeRequest.handle}: #1187`,
        })
        expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
        expect(screen.queryByRole('link')).toBeNull()

        fireEvent.click(trigger)

        expect(handlers.onOpenDetails).toHaveBeenCalledExactlyOnceWith(
          requestRow
        )
        expect(screen.queryByRole('dialog')).toBeNull()
        expect(screen.queryByRole('menu')).toBeNull()
        expect(handlers.onRequestConfirm).not.toHaveBeenCalled()
        expect(handlers.onRequestCancel).not.toHaveBeenCalled()
      })

      it('keeps request details accessible to a viewer', () => {
        const handlers = renderActions({ canWrite: false })
        fireEvent.click(
          screen.getByRole('button', {
            name: `${t.changeRequest.handle}: #1187`,
          })
        )
        expect(handlers.onOpenDetails).toHaveBeenCalledExactlyOnceWith(
          requestRow
        )
      })

      it('does not open the request while the row is busy', () => {
        const handlers = renderActions({ isActing: true })
        const trigger = screen.getByRole('button', {
          name: `${t.changeRequest.handle}: #1187`,
        })
        expect(
          (trigger as HTMLButtonElement).disabled ||
            trigger.getAttribute('aria-disabled') === 'true'
        ).toBe(true)
        fireEvent.click(trigger)
        expect(handlers.onOpenDetails).not.toHaveBeenCalled()
      })

      it('preserves the ordinary row menu and its details action', async () => {
        const ordinaryRow = { ...requestRow, change_request: null }
        const handlers = renderActions({ row: ordinaryRow })
        const trigger = screen.getByRole('button', {
          name: t.confirmations.actions.more.replace('{order}', '#1187'),
        })
        if (skin === 'embedded') fireEvent.click(trigger)
        else fireEvent.keyDown(trigger, { key: 'Enter' })
        expect(handlers.onOpenDetails).not.toHaveBeenCalled()

        fireEvent.click(
          await screen.findByRole(skin === 'embedded' ? 'button' : 'menuitem', {
            name: t.table.actions.details,
          })
        )
        expect(handlers.onOpenDetails).toHaveBeenCalledExactlyOnceWith(
          ordinaryRow
        )
      })

      if (skin === 'standalone' && layout === 'stacked') {
        it('retains the mobile Handle request button', () => {
          const handlers = renderActions()
          fireEvent.click(
            screen.getByRole('button', {
              name: t.changeRequest.handle,
            })
          )
          expect(handlers.onOpenDetails).toHaveBeenCalledExactlyOnceWith(
            requestRow
          )
        })
      }
    })
  }
}
