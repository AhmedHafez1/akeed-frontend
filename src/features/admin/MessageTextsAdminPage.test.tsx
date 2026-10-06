import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../public/messages/ar.json'
import en from '../../../public/messages/en.json'
import { AdminApiError } from './adminApi'
import { getMessageTexts, saveMessageText } from './adminMessageTextsApi'
import type { MessageTextsResponse } from './admin-message-texts.model'
import { renderAdmin } from './adminTemplatesTestUtils'
import { MessageTextsAdminPage } from './MessageTextsAdminPage'

vi.mock('./adminMessageTextsApi', () => ({
  getMessageTexts: vi.fn(),
  saveMessageText: vi.fn(),
}))

function response(
  change: Partial<MessageTextsResponse> = {}
): MessageTextsResponse {
  return {
    operations: { enabled: true, operator: true },
    switches: {
      acknowledgment: true,
      unresolved_reply_nudge: false,
      localized_fallbacks: false,
    },
    options: {
      purposes: [
        'ack_confirmed',
        'ack_canceled',
        'unresolved_reply_nudge',
        'fallback_customer_name',
        'fallback_store_name',
      ],
      languages: ['ar', 'en'],
      default_style: 'default',
      variables: {
        ack_confirmed: ['order', 'store'],
        ack_canceled: ['order', 'store'],
        unresolved_reply_nudge: ['order', 'store'],
        fallback_customer_name: [],
        fallback_store_name: [],
      },
      limits: { body: 4096, fallback: 60 },
    },
    texts: [
      {
        id: 'text-1',
        purpose: 'ack_confirmed',
        language: 'ar',
        style: 'egyptian',
        body: 'طلبك رقم #{{order}} اتأكد.',
        is_active: true,
        updated_at: '2026-10-06T00:00:00.000Z',
      },
      {
        id: 'text-2',
        purpose: 'ack_confirmed',
        language: 'ar',
        style: 'default',
        body: 'تم تأكيد طلبك رقم #{{order}}.',
        is_active: true,
        updated_at: '2026-10-06T00:00:00.000Z',
      },
    ],
    ...change,
  }
}

const copy = ar.adminMessageTexts

beforeEach(() => {
  vi.mocked(getMessageTexts).mockReset()
  vi.mocked(saveMessageText).mockReset()
})

describe('MessageTextsAdminPage (US-08-07)', () => {
  it('lists each purpose with its switch, the default style first', async () => {
    vi.mocked(getMessageTexts).mockResolvedValue(response())
    renderAdmin(<MessageTextsAdminPage />)

    expect(
      await screen.findByRole('heading', {
        name: copy.purposes.ack_confirmed.title,
      })
    ).toBeTruthy()
    expect(screen.getAllByText(copy.switchOn)).toHaveLength(2)
    const bodies = screen
      .getAllByRole('textbox')
      .map((box) => (box as HTMLTextAreaElement).value)
    expect(bodies.slice(0, 2)).toEqual([
      'تم تأكيد طلبك رقم #{{order}}.',
      'طلبك رقم #{{order}} اتأكد.',
    ])
  })

  it('saves an edited text and reloads', async () => {
    vi.mocked(getMessageTexts).mockResolvedValue(response())
    vi.mocked(saveMessageText).mockResolvedValue({
      change: 'update',
      text: response().texts[1],
    })
    renderAdmin(<MessageTextsAdminPage />)
    await screen.findByDisplayValue('تم تأكيد طلبك رقم #{{order}}.')

    fireEvent.change(
      screen.getByDisplayValue('تم تأكيد طلبك رقم #{{order}}.'),
      { target: { value: 'تم تأكيد طلبك #{{order}} من {{store}}.' } }
    )
    fireEvent.click(screen.getAllByRole('button', { name: copy.save })[0])

    await waitFor(() =>
      expect(saveMessageText).toHaveBeenCalledWith({
        purpose: 'ack_confirmed',
        language: 'ar',
        style: 'default',
        body: 'تم تأكيد طلبك #{{order}} من {{store}}.',
        is_active: true,
      })
    )
    await waitFor(() => expect(getMessageTexts).toHaveBeenCalledTimes(2))
  })

  it('explains a refused text by its rule', async () => {
    vi.mocked(getMessageTexts).mockResolvedValue(response())
    vi.mocked(saveMessageText).mockRejectedValue(
      new AdminApiError(
        'refused',
        400,
        'req-1',
        'WHATSAPP_MESSAGE_TEXT_INVALID',
        {
          rule: 'variable_not_allowed',
        }
      )
    )
    renderAdmin(<MessageTextsAdminPage />)
    const box = await screen.findByDisplayValue('تم تأكيد طلبك رقم #{{order}}.')
    fireEvent.change(box, { target: { value: 'أهلًا {{customer}}' } })
    fireEvent.click(screen.getAllByRole('button', { name: copy.save })[0])

    expect(
      await screen.findByText(copy.rules.variable_not_allowed)
    ).toBeTruthy()
  })

  it('is read-only, with the reason, for staff who are not operators', async () => {
    vi.mocked(getMessageTexts).mockResolvedValue(
      response({ operations: { enabled: true, operator: false } })
    )
    renderAdmin(<MessageTextsAdminPage />)
    expect(
      await screen.findByText(ar.adminTemplates.access.notOperator)
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: copy.save })).toBeNull()
    expect(screen.queryByText(copy.addTitle)).toBeNull()
  })

  it('shows the empty state and the error state in English', async () => {
    vi.mocked(getMessageTexts).mockResolvedValueOnce(response({ texts: [] }))
    const view = renderAdmin(<MessageTextsAdminPage />, 'en')
    expect(
      await screen.findByText(en.adminMessageTexts.empty.title)
    ).toBeTruthy()
    view.unmount()

    vi.mocked(getMessageTexts).mockRejectedValueOnce(
      new AdminApiError('down', 500, 'req-2')
    )
    renderAdmin(<MessageTextsAdminPage />, 'en')
    expect(
      await screen.findByText(en.adminTemplates.errors.requestFailed)
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: en.adminCommon.retry })
    ).toBeTruthy()
  })
})
