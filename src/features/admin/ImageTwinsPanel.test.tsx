import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import {
  activateApprovedImageTwins,
  createMissingImageTwins,
  getImageTwins,
} from './adminImageTwinsApi'
import { AdminApiError } from './adminApi'
import type { ImageTwinOverview } from './admin-image-twins.model'
import { imageTwinCounts } from './admin-image-twins.model'
import { ImageTwinsPanel } from './ImageTwinsPanel'
import { renderAdmin } from './adminTemplatesTestUtils'

vi.mock('./adminImageTwinsApi', () => ({
  getImageTwins: vi.fn(),
  createMissingImageTwins: vi.fn(),
  activateApprovedImageTwins: vi.fn(),
}))

function overview(
  overrides: Partial<ImageTwinOverview> = {}
): ImageTwinOverview {
  return {
    meta_app_configured: true,
    parents: [
      {
        key: 'cod_confirm.ar.standard',
        template_name: 'akeed_cod_verification',
        language_code: 'ar',
        twin: {
          template_name: 'akeed_cod_verification_logo',
          is_active: false,
          review_status: 'approved',
        },
      },
      {
        key: 'cod_confirm.en.friendly',
        template_name: 'akeed_cod_verification_friendly',
        language_code: 'en',
        twin: null,
      },
      {
        key: 'cod_confirm.es.standard_v1',
        template_name: 'akeed_cod_confirm_standard_v1',
        language_code: 'es',
        twin: null,
      },
    ],
    ...overrides,
  }
}

describe('imageTwinCounts', () => {
  it('counts parents, twins, approved, active and missing', () => {
    expect(imageTwinCounts(overview().parents)).toEqual({
      parents: 3,
      twins: 1,
      approved: 1,
      active: 0,
      missing: 2,
    })
  })
})

describe('ImageTwinsPanel', () => {
  beforeEach(() => {
    vi.mocked(getImageTwins).mockReset().mockResolvedValue(overview())
    vi.mocked(createMissingImageTwins).mockReset()
    vi.mocked(activateApprovedImageTwins).mockReset()
  })

  it('shows the counts and no actions to staff who are not operators', async () => {
    renderAdmin(<ImageTwinsPanel operator={false} />, 'en')
    expect(await screen.findByText('Missing')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Create missing twins' })
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Activate approved twins' })
    ).toBeNull()
  })

  it('asks before submitting, then lists each outcome', async () => {
    vi.mocked(createMissingImageTwins).mockResolvedValue({
      results: [
        {
          parent_key: 'cod_confirm.en.friendly',
          parent_template_name: 'akeed_cod_verification_friendly',
          language_code: 'en',
          twin_template_name: 'akeed_cod_verification_friendly_logo',
          outcome: 'created',
          reason: null,
          provider_code: null,
          review_status: 'pending',
        },
        {
          parent_key: 'cod_confirm.es.standard_v1',
          parent_template_name: 'akeed_cod_confirm_standard_v1',
          language_code: 'es',
          twin_template_name: 'akeed_cod_confirm_standard_v1_logo',
          outcome: 'failed',
          reason: 'invalid_parameter',
          provider_code: 100,
          review_status: null,
        },
      ],
    })
    renderAdmin(<ImageTwinsPanel operator />, 'en')

    fireEvent.click(
      await screen.findByRole('button', { name: 'Create missing twins' })
    )
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(/This submits 2 templates to Meta/)
    ).toBeTruthy()
    expect(createMissingImageTwins).not.toHaveBeenCalled()

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create missing twins' })
    )

    await waitFor(() => expect(createMissingImageTwins).toHaveBeenCalledOnce())
    expect(await within(dialog).findByText('Submitted')).toBeTruthy()
    expect(within(dialog).getByText('Refused')).toBeTruthy()
    expect(within(dialog).getByText('invalid_parameter · #100')).toBeTruthy()
    // The list is read again after the run.
    await waitFor(() => expect(getImageTwins).toHaveBeenCalledTimes(2))
  })

  it('cannot create without META_APP_ID and says why', async () => {
    vi.mocked(getImageTwins).mockResolvedValue(
      overview({ meta_app_configured: false })
    )
    renderAdmin(<ImageTwinsPanel operator />, 'en')
    expect(
      await screen.findByText(/Set META_APP_ID to create twins/)
    ).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: 'Create missing twins',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('activates the approved twins and reports what is waiting (ar)', async () => {
    vi.mocked(activateApprovedImageTwins).mockResolvedValue({
      activated: ['cod_confirm.ar.standard_logo'],
      waiting: [{ key: 'cod_confirm.en.friendly', review_status: 'pending' }],
    })
    renderAdmin(<ImageTwinsPanel operator />, 'ar')

    fireEvent.click(
      await screen.findByRole('button', { name: 'تفعيل النسخ المعتمدة' })
    )

    expect(
      await screen.findByText('فُعّلت نسخة واحدة. واحدة بانتظار الاعتماد.')
    ).toBeTruthy()
  })

  it('shows a failed load with a retry', async () => {
    vi.mocked(getImageTwins).mockRejectedValue(
      new AdminApiError('down', 503, 'req-1')
    )
    renderAdmin(<ImageTwinsPanel operator />, 'en')
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})
