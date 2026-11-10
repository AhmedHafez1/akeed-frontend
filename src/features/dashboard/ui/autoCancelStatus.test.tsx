import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { StatusCell as EmbeddedStatusCell } from '@/features/dashboard/skins/embedded/components/confirmations/confirmationRowView'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import { StatusCell as StandaloneStatusCell } from '@/features/dashboard/skins/standalone/components/confirmations/confirmationCells'
import { renderStandalone } from '@/features/dashboard/skins/standalone/components/shared/standaloneTestUtils'

describe.each([
  { skin: 'embedded', StatusCell: EmbeddedStatusCell, render: renderEmbedded },
  {
    skin: 'standalone',
    StatusCell: StandaloneStatusCell,
    render: renderStandalone,
  },
])('$skin auto-cancel status indicator', ({ StatusCell, render }) => {
  it.each([
    ['en', 'Change requested', 'Customer not notified'],
    ['ar', 'طلب تعديل', 'لم يُبلَّغ العميل'],
  ] as const)(
    'hides the auto-cancel icon and tooltip for a change request in %s',
    (locale, badge, warning) => {
      const row = {
        id: 'v-1',
        status: 'read',
        action_reason: null,
        auto_cancel: {
          state: 'scheduled',
          scheduled_for: '2026-11-12T09:00:00.000Z',
          reason: null,
          excluded: false,
          late_reply: false,
        },
      } as VerificationItem
      const eligible = render(<StatusCell row={row} timeZone="UTC" />, locale)
      const marker = screen.getByRole('img')
      const tooltip = marker.getAttribute('title')!
      expect(tooltip).toBeTruthy()
      expect(marker.getAttribute('aria-label')).toBe(tooltip)
      eligible.unmount()

      const { container } = render(
        <StatusCell
          row={{
            ...row,
            action_reason: 'change_requested',
            change_request: {
              id: 'cr-1',
              opened_at: '2026-11-10T09:00:00.000Z',
              confirmation_cycle: 1,
              acknowledgment: { status: 'failed', reason: 'sending_failed' },
              reconfirmation: {
                state: null,
                scheduled_for: null,
                last_error: null,
              },
            },
          }}
          timeZone="UTC"
        />,
        locale
      )

      expect(screen.getByText(badge)).toBeTruthy()
      expect(screen.queryByLabelText(tooltip)).toBeNull()
      expect(screen.queryByTitle(tooltip)).toBeNull()
      expect(container.querySelectorAll('[role="img"]')).toHaveLength(1)
      expect(
        screen.getByRole('img', { name: warning }).getAttribute('title')
      ).toBe(warning)
    }
  )
})
