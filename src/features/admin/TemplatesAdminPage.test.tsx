import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError } from './adminApi'
import { getAdminTemplates, runAdminTemplateSync } from './adminTemplatesApi'
import {
  renderAdmin,
  templateList,
  templateSummary,
} from './adminTemplatesTestUtils'
import { TemplatesAdminPage } from './TemplatesAdminPage'

vi.mock('./adminTemplatesApi', () => ({
  getAdminTemplates: vi.fn(),
  getAdminTemplate: vi.fn(),
  runAdminTemplateSync: vi.fn(),
  sendAdminTemplateTest: vi.fn(),
}))

const direct = templateSummary({
  key: 'cod_confirm.en.direct',
  language: 'en',
  style: 'direct',
  template_name: 'akeed_cod_verification_direct_',
  language_code: 'en',
  review_status: 'missing',
  quality: null,
  category: null,
  is_default: false,
  sendable: false,
  active_store_count: 1,
  drift: { state: 'missing', kinds: [], severity: null },
  metrics: {
    sends: 0,
    delivered: 0,
    read: 0,
    replies: 0,
    confirmed: 0,
    canceled: 0,
    no_reply: 0,
    reply_rate: null,
    confirmation_rate: null,
  },
})

const never = () => new Promise<never>(() => undefined)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.mocked(getAdminTemplates).mockResolvedValue(
    templateList([templateSummary(), direct])
  )
})

describe('TemplatesAdminPage', () => {
  it.each([
    ['en', 'Templates', 'Loading templates…'],
    ['ar', 'القوالب', 'جارٍ تحميل القوالب…'],
  ] as const)('shows a loading state in %s', (lang, title, loading) => {
    vi.mocked(getAdminTemplates).mockImplementation(never)

    renderAdmin(<TemplatesAdminPage />, lang)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title)
    expect(screen.getByRole('status').textContent).toBe(loading)
  })

  it('lists each template with its Meta status, usage and rates, in English', async () => {
    renderAdmin(<TemplatesAdminPage />, 'en')

    const link = await screen.findByRole('link', {
      name: 'cod_confirm.ar.standard',
    })
    expect(link.getAttribute('href')).toBe(
      '/en/admin/templates/cod_confirm.ar.standard'
    )
    const row = within(link.closest('tr')!)
    expect(row.getByText('akeed_cod_verification_friendly [ar]')).toBeTruthy()
    expect(row.getByText('COD confirmation')).toBeTruthy()
    expect(row.getByText('Arabic')).toBeTruthy()
    expect(row.getByText('Approved')).toBeTruthy()
    expect(row.getByText('Utility')).toBeTruthy()
    expect(row.getByText('Not rated yet')).toBeTruthy()
    expect(row.getByText('Language default')).toBeTruthy()
    expect(row.getByText('12')).toBeTruthy()
    expect(row.getByText('40')).toBeTruthy()
    expect(row.getByText('62.5%')).toBeTruthy()
    expect(row.getByText('52.5%')).toBeTruthy()
    expect(row.getByText('Matches Meta')).toBeTruthy()
    expect(row.getByText(/Oct 5, 2026/)).toBeTruthy()
  })

  it('marks a template Meta does not hold, and shows no rate without sends', async () => {
    renderAdmin(<TemplatesAdminPage />, 'en')

    const link = await screen.findByRole('link', {
      name: 'cod_confirm.en.direct',
    })
    const row = within(link.closest('tr')!)
    expect(row.getAllByText('Missing at Meta')).toHaveLength(2)
    expect(row.getByText('Cannot be sent')).toBeTruthy()
    expect(row.getAllByText('—').length).toBeGreaterThanOrEqual(3)
  })

  it('renders the same list in Arabic, right to left', async () => {
    const { container } = renderAdmin(<TemplatesAdminPage />, 'ar')

    const link = await screen.findByRole('link', {
      name: 'cod_confirm.ar.standard',
    })
    expect(link.getAttribute('href')).toBe(
      '/ar/admin/templates/cod_confirm.ar.standard'
    )
    expect(container.querySelector('section')?.getAttribute('dir')).toBe('rtl')
    const row = within(link.closest('tr')!)
    expect(row.getByText('معتمد')).toBeTruthy()
    expect(row.getByText('تأكيد الدفع عند الاستلام')).toBeTruthy()
    expect(row.getByText('يطابق ميتا')).toBeTruthy()
    // The key and the Meta name stay left to right inside the Arabic page.
    expect(link.getAttribute('dir')).toBe('ltr')
    expect(
      screen.getByRole('columnheader', { name: 'معدل التأكيد' })
    ).toBeTruthy()
  })

  it.each([
    ['en', 'No templates yet'],
    ['ar', 'لا توجد قوالب بعد'],
  ] as const)('shows an empty state in %s', async (lang, title) => {
    vi.mocked(getAdminTemplates).mockResolvedValue(templateList([]))

    renderAdmin(<TemplatesAdminPage />, lang)

    expect(await screen.findByRole('heading', { name: title })).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it.each([
    ['en', 'The request failed. Try again.', 'Retry'],
    ['ar', 'فشل الطلب. حاول مرة أخرى.', 'إعادة المحاولة'],
  ] as const)(
    'shows an error with the request ID and retries, in %s',
    async (lang, message, retry) => {
      vi.mocked(getAdminTemplates).mockRejectedValueOnce(
        new AdminApiError('boom', 500, 'req-42')
      )

      renderAdmin(<TemplatesAdminPage />, lang)

      const alert = await screen.findByRole('alert')
      expect(alert.textContent).toContain(message)
      expect(alert.textContent).toContain('req-42')
      expect(alert.textContent).not.toContain('boom')

      fireEvent.click(within(alert).getByRole('button', { name: retry }))

      expect(
        await screen.findByRole('link', { name: 'cod_confirm.ar.standard' })
      ).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    }
  )

  it('translates a refusal by its code', async () => {
    vi.mocked(getAdminTemplates).mockRejectedValue(
      new AdminApiError(
        'range',
        400,
        null,
        'ADMIN_TEMPLATE_METRICS_RANGE_INVALID'
      )
    )

    renderAdmin(<TemplatesAdminPage />, 'en')

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Choose a date range of at most 92 days.'
    )
  })

  it('filters by language, status and active flag, and resets', async () => {
    renderAdmin(<TemplatesAdminPage />, 'en')
    await screen.findByRole('link', { name: 'cod_confirm.ar.standard' })

    fireEvent.change(screen.getByLabelText('Language'), {
      target: { value: 'en' },
    })
    expect(
      screen.queryByRole('link', { name: 'cod_confirm.ar.standard' })
    ).toBeNull()
    expect(
      screen.getByRole('link', { name: 'cod_confirm.en.direct' })
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Meta status'), {
      target: { value: 'approved' },
    })
    expect(screen.getByText('No template matches these filters.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)

    fireEvent.change(screen.getByLabelText('In Akeed'), {
      target: { value: 'inactive' },
    })
    expect(screen.getByText('No template matches these filters.')).toBeTruthy()
  })

  it('asks for the chosen date range, and not for an invalid one', async () => {
    renderAdmin(<TemplatesAdminPage />, 'en')
    await screen.findByRole('link', { name: 'cod_confirm.ar.standard' })
    const calls = () => vi.mocked(getAdminTemplates).mock.calls.length
    const before = calls()

    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-10-01' },
    })
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: '2026-10-03' },
    })
    await waitFor(() =>
      expect(vi.mocked(getAdminTemplates).mock.lastCall?.[0]).toEqual({
        from: '2026-10-01',
        to: '2026-10-03',
      })
    )
    const afterValid = calls()
    expect(afterValid).toBeGreaterThan(before)

    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: '2026-09-01' },
    })
    expect(screen.getByRole('alert').textContent).toBe(
      'Choose a start date that is not after the end date.'
    )
    expect(calls()).toBe(afterValid)
  })

  it('runs a sync for an operator and shows what it found', async () => {
    vi.mocked(runAdminTemplateSync).mockResolvedValue({
      id: 'run-1',
      trigger: 'manual',
      status: 'succeeded',
      started_at: '2026-10-05T20:00:00.000Z',
      finished_at: '2026-10-05T20:00:02.000Z',
      error_code: null,
      provider_template_count: 9,
      updated_count: 7,
      unchanged_count: 1,
      missing_keys: ['cod_confirm.en.direct'],
      unknown_at_provider: [
        { template_name: 'akeed_cod_verification_direct', language_code: 'en' },
        { template_name: 'hello_world', language_code: 'en_US' },
      ],
    })
    renderAdmin(<TemplatesAdminPage />, 'en')

    fireEvent.click(await screen.findByRole('button', { name: 'Sync now' }))

    const result = await screen.findByText('Sync finished.')
    const panel = result.closest('[role="status"]') as HTMLElement
    expect(panel.textContent).toContain('Updated7')
    expect(panel.textContent).toContain('Unchanged1')
    expect(panel.textContent).toContain('Missing at Meta1')
    expect(panel.textContent).toContain('At Meta, not in Akeed2')
    expect(panel.textContent).toContain('cod_confirm.en.direct')
    expect(panel.textContent).toContain('akeed_cod_verification_direct [en]')
    await waitFor(() =>
      expect(vi.mocked(getAdminTemplates).mock.calls.length).toBeGreaterThan(1)
    )
  })

  it('shows a failed sync and a refused one with their reasons', async () => {
    vi.mocked(runAdminTemplateSync).mockResolvedValueOnce({
      id: 'run-2',
      trigger: 'manual',
      status: 'failed',
      started_at: '2026-10-05T20:00:00.000Z',
      finished_at: '2026-10-05T20:00:01.000Z',
      error_code: 'rate_limited',
      provider_template_count: null,
      updated_count: null,
      unchanged_count: null,
      missing_keys: [],
      unknown_at_provider: [],
    })
    renderAdmin(<TemplatesAdminPage />, 'en')

    fireEvent.click(await screen.findByRole('button', { name: 'Sync now' }))
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Sync failed: Meta asked us to slow down'
    )

    vi.mocked(runAdminTemplateSync).mockRejectedValueOnce(
      new AdminApiError(
        'cooldown',
        409,
        null,
        'WHATSAPP_TEMPLATE_SYNC_COOLDOWN'
      )
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'A sync finished moments ago.'
      )
    )
  })

  it('offers no sync to staff who are not operators, or while sync is off', async () => {
    vi.mocked(getAdminTemplates).mockResolvedValue(
      templateList([templateSummary()], {
        operations: {
          enabled: true,
          operator: false,
          test_send_available: false,
        },
      })
    )
    const first = renderAdmin(<TemplatesAdminPage />, 'en')
    await screen.findByRole('link', { name: 'cod_confirm.ar.standard' })
    expect(screen.queryByRole('button', { name: 'Sync now' })).toBeNull()
    first.unmount()

    vi.mocked(getAdminTemplates).mockResolvedValue(
      templateList([templateSummary()], {
        sync: { enabled: false, guardrail_enabled: false, last_run: null },
      })
    )
    renderAdmin(<TemplatesAdminPage />, 'en')
    await screen.findByRole('link', { name: 'cod_confirm.ar.standard' })
    expect(screen.queryByRole('button', { name: 'Sync now' })).toBeNull()
    expect(
      screen.getByText(/Template sync is off in this environment/)
    ).toBeTruthy()
  })

  it('has no control that creates or edits a template', async () => {
    renderAdmin(<TemplatesAdminPage />, 'en')
    await screen.findByRole('link', { name: 'cod_confirm.ar.standard' })

    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.textContent)
        .sort()
    ).toEqual(['Refresh', 'Reset filters', 'Sync now'])
  })
})
