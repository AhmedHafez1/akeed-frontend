import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderAdmin } from './adminTemplatesTestUtils'
import {
  TipAnnouncementFields,
  TipEmailDelivery,
  TipEmailPreview,
} from './TipAnnouncementFields'
import {
  emptyTipForm,
  tipDraftPayload,
  type AdminTipCampaign,
} from './admin-tips.model'
import { getTipEmailPreview, stopTipEmail } from './adminTipsApi'

vi.mock('./adminTipsApi', () => ({
  getTipEmailPreview: vi.fn(),
  stopTipEmail: vi.fn(),
}))
const campaign: AdminTipCampaign = {
  name: 'Launch',
  type: 'update',
  status: 'draft',
  effective_status: 'draft',
  show_as_banner: false,
  action: null,
  expires_at: null,
  audience: {
    mode: 'filters',
    filters: {},
    selected_org_ids: [],
    excluded_org_ids: [],
  },
  translations: [
    {
      locale: 'en',
      title: 'Launch',
      description: 'Own number',
      action_label: null,
    },
  ],
  review: null,
  published_at: null,
  recipient_count: null,
  paused_at: null,
  archived_at: null,
  created_at: '2026-11-19T12:00:00Z',
  updated_at: '2026-11-19T12:00:00Z',
  analytics: { recipients: 0, viewed: 0, clicked: 0, dismissed: 0 },
  id: 'synthetic-campaign',
  revision: 1,
  email: {
    translations: [{ locale: 'en', subject: 'Launch', body: '{planLine}' }],
  },
  email_enabled: false,
  email_stopped_at: null,
  email_stats: {
    pending: 2,
    processing: 0,
    sent: 3,
    skipped: 1,
    failed: 1,
    reasons: { unsubscribed: 1, provider_outcome_unresolved: 1 },
  },
}

function Editor() {
  const [form, setForm] = useState(emptyTipForm())
  return (
    <>
      <TipAnnouncementFields
        form={form}
        onChange={setForm}
        readOnly={false}
        secondaryReadOnly={false}
      />
      <output data-testid="payload">
        {JSON.stringify(tipDraftPayload(form))}
      </output>
    </>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getTipEmailPreview).mockResolvedValue({
    locale: 'ar',
    sample: 'basic',
    subject: 'خبر',
    text: 'رسالة',
    html: '<html dir="rtl"><body>رسالة</body></html>',
  })
  vi.mocked(stopTipEmail).mockResolvedValue(campaign)
})

describe('campaign announcement controls', () => {
  it('includes an optional email, preserves placeholders and edits each language once', () => {
    renderAdmin(<Editor />)
    fireEvent.click(screen.getByRole('switch', { name: 'Include email' }))
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Own number launch' },
    })
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Hi {storeName}\n{planLine}' },
    })
    expect(screen.getByTestId('payload').textContent).toContain('{storeName}')
    fireEvent.click(screen.getByRole('button', { name: 'العربية' }))
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'خبر جديد' },
    })
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'مرحبًا {storeName}' },
    })
    expect(screen.getByTestId('payload').textContent).toContain('خبر جديد')
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect((screen.getByLabelText('Body') as HTMLTextAreaElement).value).toBe(
      'Hi {storeName}\n{planLine}'
    )
  })
  it('shows unknown placeholders and does not offer per-merchant editing', () => {
    renderAdmin(<Editor />)
    fireEvent.click(screen.getByRole('switch', { name: 'Include email' }))
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Hi {merchantEmail}' },
    })
    expect(screen.getByRole('alert').textContent).toContain(
      'Unknown or malformed placeholder'
    )
    expect(screen.queryByLabelText('Recipient email')).toBeNull()
  })
  it('previews synthetic billing samples through the read-only API with a sandboxed frame', async () => {
    renderAdmin(<TipEmailPreview campaign={campaign} />)
    await waitFor(() =>
      expect(getTipEmailPreview).toHaveBeenCalledWith(
        campaign.id,
        'en',
        'basic'
      )
    )
    fireEvent.change(screen.getByLabelText('Sample merchant'), {
      target: { value: 'prepaid' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'اردو' }))
    await waitFor(() =>
      expect(getTipEmailPreview).toHaveBeenCalledWith(
        campaign.id,
        'ur',
        'prepaid'
      )
    )
    const frame = screen.getByTitle('Email preview')
    expect(frame.getAttribute('sandbox')).toBe('')
    expect(frame.getAttribute('srcdoc')).toContain('dir="rtl"')
    expect(screen.getByText(/Sending is off globally/)).toBeTruthy()
    expect(stopTipEmail).not.toHaveBeenCalled()
  })
  it('shows status counts and requires the existing confirmation before permanent Stop', async () => {
    const onChanged = vi.fn()
    renderAdmin(<TipEmailDelivery campaign={campaign} onChanged={onChanged} />)
    expect(screen.getByText('Pending').parentElement?.textContent).toContain(
      '2'
    )
    expect(
      screen.getByText('Sent', { exact: true }).parentElement?.textContent
    ).toContain('3')
    fireEvent.click(screen.getByRole('button', { name: 'Stop sending' }))
    expect(stopTipEmail).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Stop sending' })
    )
    await waitFor(() => expect(stopTipEmail).toHaveBeenCalledWith(campaign.id))
    expect(onChanged).toHaveBeenCalledOnce()
  })
  it('disables Stop once stopped and freezes published email editing', () => {
    renderAdmin(
      <TipEmailDelivery
        campaign={{ ...campaign, email_stopped_at: '2026-11-19T12:00:00Z' }}
        onChanged={vi.fn()}
      />
    )
    expect(
      (
        screen.getByRole('button', {
          name: 'Stop sending',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(screen.getByRole('status').textContent).toContain(
      'Sending stopped permanently'
    )
  })
})
