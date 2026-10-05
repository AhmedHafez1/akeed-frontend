import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError } from './adminApi'
import { getAdminTemplate, sendAdminTemplateTest } from './adminTemplatesApi'
import {
  renderAdmin,
  templateContext,
  templateDetail,
  templateSummary,
} from './adminTemplatesTestUtils'
import { TemplateDetailAdminPage } from './TemplateDetailAdminPage'
import type { TemplateDetailResponse } from './admin-templates.model'

vi.mock('./adminTemplatesApi', () => ({
  getAdminTemplates: vi.fn(),
  getAdminTemplate: vi.fn(),
  runAdminTemplateSync: vi.fn(),
  sendAdminTemplateTest: vi.fn(),
}))

const AR_KEY = 'cod_confirm.ar.standard'
const EN_SHORT = 'cod_confirm.en.short'

/** The positional English template, as the dev app holds it. */
function positionalDetail(
  overrides: Partial<TemplateDetailResponse> = {}
): TemplateDetailResponse {
  return templateDetail({
    template: {
      ...templateSummary({
        key: EN_SHORT,
        language: 'en',
        style: 'short',
        template_name: 'akeed_cod_verification',
        language_code: 'en',
        parameter_format: 'positional',
        is_default: false,
      }),
      provider_template_id: '900000000000003',
      text_changed_at: null,
    },
    message: {
      paragraphs: [
        'Hello',
        'We have received your order TEST-1 with Cash on Delivery.',
        'Total Price : 250.00 USD',
        'Please confirm your order.',
      ],
      buttons: [
        { label: 'Confirm', kind: 'quick_reply' },
        { label: 'Cancel', kind: 'quick_reply' },
      ],
      direction: 'ltr',
    },
    variables: [
      { variable: 'order', parameter: '1', sample: 'TEST-1' },
      { variable: 'total', parameter: '2', sample: '250.00 USD' },
    ],
    ...overrides,
  })
}

function show(
  detail: TemplateDetailResponse,
  lang: 'ar' | 'en' = 'en',
  key = detail.template.key
) {
  vi.mocked(getAdminTemplate).mockResolvedValue(detail)
  return renderAdmin(<TemplateDetailAdminPage templateKey={key} />, lang)
}

/** The bubble that carries the message text inside the phone preview. */
function bubble(text: string): HTMLElement {
  const holder = screen.getByText(text).closest('[dir]')
  if (!(holder instanceof HTMLElement)) throw new Error('no message bubble')
  return holder
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('TemplateDetailAdminPage', () => {
  it.each([
    ['en', 'Loading templates…'],
    ['ar', 'جارٍ تحميل القوالب…'],
  ] as const)('shows a loading state in %s', (lang, loading) => {
    vi.mocked(getAdminTemplate).mockImplementation(
      () => new Promise<never>(() => undefined)
    )

    renderAdmin(<TemplateDetailAdminPage templateKey={AR_KEY} />, lang)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(AR_KEY)
    expect(screen.getByRole('status').textContent).toBe(loading)
  })

  it("renders a named Arabic template from Meta's text, right to left on an English page", async () => {
    const { container } = show(templateDetail(), 'en')

    await screen.findByText('أهلاً بك أحمد! 👋')
    expect(container.querySelector('section')?.getAttribute('dir')).toBe('ltr')
    const message = bubble('أهلاً بك أحمد! 👋')
    expect(message.getAttribute('dir')).toBe('rtl')
    expect(
      within(message).getByText(
        'طلبك رقم #TEST-1 بقيمة 250.00 USD جاهز تقريباً للشحن!'
      )
    ).toBeTruthy()
    expect(within(message).getByText('تأكيد الطلب')).toBeTruthy()
    expect(within(message).getByText('إلغاء الطلب')).toBeTruthy()
    expect(
      screen.getByText(
        "Meta's text with sample values, as a customer receives it."
      )
    ).toBeTruthy()
    // The hand-kept preview is not what is shown when Meta's text exists.
    expect(screen.queryByText('إجمالي الطلب: 250.00 USD')).toBeNull()
    expect(getAdminTemplate).toHaveBeenCalledWith(AR_KEY, expect.any(Object))
  })

  it('renders a positional English template left to right on an Arabic page', async () => {
    const { container } = show(positionalDetail(), 'ar')

    await screen.findByText(
      'We have received your order TEST-1 with Cash on Delivery.'
    )
    expect(container.querySelector('section')?.getAttribute('dir')).toBe('rtl')
    const message = bubble('Total Price : 250.00 USD')
    expect(message.getAttribute('dir')).toBe('ltr')
    expect(within(message).getByText('Confirm')).toBeTruthy()
    expect(within(message).getByText('Cancel')).toBeTruthy()
    expect(
      screen.getByText('نص ميتا بقيم تجريبية، كما يستلمه العميل.')
    ).toBeTruthy()
  })

  it('shows the variable mapping for named and positional templates', async () => {
    const named = show(templateDetail(), 'en')
    const namedTable = within(
      (
        await screen.findByRole('columnheader', { name: 'Meta parameter' })
      ).closest('table')!
    )
    expect(
      namedTable
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent)
    ).toEqual([
      'Customer namecustomerأحمد',
      'Store namestoreمتجر أكيد',
      'Order numberorderTEST-1',
      'Order totaltotal250.00 USD',
    ])
    named.unmount()

    show(positionalDetail(), 'en')
    const positionalTable = within(
      (
        await screen.findByRole('columnheader', { name: 'Meta parameter' })
      ).closest('table')!
    )
    expect(
      positionalTable
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent)
    ).toEqual(['Order number1TEST-1', 'Order total2250.00 USD'])
    expect(screen.getByText('Positional')).toBeTruthy()
  })

  it.each([
    [
      'en',
      'The preview merchants see differs from Meta’s text',
      'Message text',
      'In Akeed',
      'At Meta',
    ],
    [
      'ar',
      'المعاينة التي يراها التجار تختلف عن نص ميتا',
      'نص الرسالة',
      'في أكيد',
      'لدى ميتا',
    ],
  ] as const)(
    'warns about a text difference and shows both sides, in %s',
    async (lang, title, kind, registered, provider) => {
      show(
        templateDetail({
          drift: {
            state: 'drift',
            kinds: ['body'],
            severity: 'preview',
            differences: [
              {
                kind: 'body',
                severity: 'preview',
                registered: 'أهلًا بك {{customer}} 👋 إجمالي الطلب: {{total}}',
                provider: 'أهلاً بك {{customer}}! 👋',
              },
            ],
          },
        }),
        lang
      )

      const alert = (await screen.findByText(title.replace('’', "'"))).closest(
        '[role="alert"]'
      ) as HTMLElement
      const view = within(alert)
      expect(view.getByText(kind)).toBeTruthy()
      expect(view.getByText(registered)).toBeTruthy()
      expect(view.getByText(provider)).toBeTruthy()
      const held = view.getByText('أهلاً بك {{customer}}! 👋')
      expect(held.getAttribute('dir')).toBe('rtl')
      expect(
        view.getByText('أهلًا بك {{customer}} 👋 إجمالي الطلب: {{total}}')
      ).toBeTruthy()
      expect(alert.className).toContain('warning')
    }
  )

  it('raises a send difference as a blocking warning', async () => {
    show(
      positionalDetail({
        drift: {
          state: 'drift',
          kinds: ['variables', 'buttons'],
          severity: 'send',
          differences: [
            {
              kind: 'variables',
              severity: 'send',
              registered: '1, 2',
              provider: '1, 2, 3',
            },
            {
              kind: 'buttons',
              severity: 'send',
              registered: 'quick_reply, quick_reply',
              provider: 'quick_reply',
            },
          ],
        },
      }),
      'en'
    )

    const alert = (
      await screen.findByText(
        'What Akeed sends does not match this template at Meta'
      )
    ).closest('[role="alert"]') as HTMLElement
    expect(alert.className).toContain('destructive')
    expect(within(alert).getByText('Variables')).toBeTruthy()
    expect(within(alert).getByText('Buttons')).toBeTruthy()
    expect(within(alert).getByText('1, 2, 3')).toBeTruthy()
  })

  it.each([
    ['en', 'Meta has no template with this name and language'],
    ['ar', 'لا يوجد لدى ميتا قالب بهذا الاسم وهذه اللغة'],
  ] as const)(
    'says clearly when Meta does not hold the template, in %s',
    async (lang, title) => {
      show(
        templateDetail({
          template: {
            ...templateSummary({
              key: 'cod_confirm.en.direct',
              language: 'en',
              review_status: 'missing',
              sendable: false,
              is_default: false,
              drift: { state: 'missing', kinds: [], severity: null },
            }),
            provider_template_id: null,
            text_changed_at: null,
          },
          message: null,
          registered_preview: {
            paragraphs: ['Hi Ahmed,', 'We are preparing your order #TEST-1.'],
            buttons: [
              { label: 'Ship My Order', kind: 'quick_reply' },
              { label: 'Cancel', kind: 'quick_reply' },
            ],
            direction: 'ltr',
          },
          drift: {
            state: 'missing',
            kinds: [],
            severity: null,
            differences: [],
          },
        }),
        lang
      )

      const alert = (await screen.findByText(title)).closest(
        '[role="alert"]'
      ) as HTMLElement
      expect(alert.className).toContain('destructive')
      // With no Meta text, Akeed's own preview is shown and labelled as such.
      expect(bubble('Hi Ahmed,').getAttribute('dir')).toBe('ltr')
      expect(
        screen.getByText(
          lang === 'en'
            ? "Akeed's own preview with sample values. Meta's text is not available."
            : 'معاينة أكيد بقيم تجريبية. نص ميتا غير متاح.'
        )
      ).toBeTruthy()
      // A template that cannot be sent offers no test send.
      expect(screen.queryByRole('textbox')).toBeNull()
    }
  )

  it('explains a paused template, a coming category change and a never-synced one', async () => {
    const paused = show(
      templateDetail({
        template: {
          ...templateSummary({
            review_status: 'paused',
            sendable: false,
            pending_category: 'marketing',
          }),
          provider_template_id: '900000000000007',
          text_changed_at: '2026-10-04T08:00:00.000Z',
        },
      }),
      'en'
    )
    expect(
      (await screen.findByText('This template cannot be sent now')).closest(
        '[role="alert"]'
      )?.textContent
    ).toContain('Meta status: Paused.')
    expect(
      screen.getByText("Meta is changing this template's category")
    ).toBeTruthy()
    expect(screen.getByText(/It will become Marketing\./)).toBeTruthy()
    paused.unmount()

    show(
      templateDetail({
        template: {
          ...templateSummary({ review_status: null, last_synced_at: null }),
          provider_template_id: null,
          text_changed_at: null,
        },
        message: null,
        drift: {
          state: 'not_synced',
          kinds: [],
          severity: null,
          differences: [],
        },
      }),
      'en'
    )
    const note = (await screen.findByText('Not synced with Meta yet')).closest(
      '[role="status"]'
    )
    expect(note?.className).toContain('info')
    expect(screen.getAllByText('Never').length).toBeGreaterThanOrEqual(1)
  })

  it('shows per-purpose metrics, the stores that send it and its history', async () => {
    show(
      positionalDetail({
        metrics_by_purpose: [
          {
            purpose: 'initial',
            sends: 10,
            delivered: 9,
            read: 8,
            replies: 6,
            confirmed: 5,
            canceled: 1,
            no_reply: 2,
            reply_rate: 0.6,
            confirmation_rate: 0.5,
          },
          {
            purpose: 'reminder',
            sends: 4,
            delivered: 4,
            read: 2,
            replies: 1,
            confirmed: 1,
            canceled: 0,
            no_reply: 3,
            reply_rate: 0.25,
            confirmation_rate: 0.25,
          },
        ],
        stores: {
          total: 120,
          shown: [
            {
              integration_id: 'integration-1',
              store_name: 'Akeed Fashion',
              platform: 'shopify',
              domain: 'akeed-fashion.myshopify.com',
              default_language: 'auto',
            },
            {
              integration_id: 'integration-2',
              store_name: null,
              platform: 'standalone',
              domain: null,
              default_language: 'en',
            },
          ],
        },
        history: {
          events: [
            {
              id: 'event-1',
              field: 'status',
              value: { status: 'paused' },
              outcome: 'applied',
              occurred_at: '2026-10-05T09:00:00.000Z',
              received_at: '2026-10-05T09:00:01.000Z',
            },
          ],
          sync_runs: [
            {
              id: 'run-1',
              trigger: 'manual',
              status: 'succeeded',
              started_at: '2026-10-05T10:00:00.000Z',
              finished_at: '2026-10-05T10:00:02.000Z',
              error_code: null,
              missing: true,
            },
            {
              id: 'run-2',
              trigger: 'scheduled',
              status: 'failed',
              started_at: '2026-10-05T04:00:00.000Z',
              finished_at: '2026-10-05T04:00:01.000Z',
              error_code: 'network',
              missing: false,
            },
          ],
        },
      }),
      'en'
    )

    const metrics = within(
      (await screen.findByRole('columnheader', { name: 'Sent as' })).closest(
        'table'
      )!
    )
    expect(
      metrics
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent)
    ).toEqual(['First message10651250%', 'Reminder4110325%'])

    expect(
      screen.getByRole('heading', { name: 'Active stores sending it (120)' })
    ).toBeTruthy()
    expect(screen.getByText('Showing the first 2.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Akeed Fashion' }).getAttribute('href')
    ).toBe('/en/admin/stores/integration-1')
    expect(screen.getByText('akeed-fashion.myshopify.com')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Unnamed store' }).getAttribute('href')
    ).toBe('/en/admin/stores/integration-2')

    expect(screen.getByText(/Status:/).textContent).toContain('Paused')
    expect(screen.getByText(/Status:/).textContent).toContain('applied')
    expect(screen.getByText(/Manual sync/).textContent).toContain(
      'Missing at Meta'
    )
    expect(screen.getByText(/Scheduled sync/).textContent).toContain(
      'Sync failed: Meta could not be reached'
    )
  })

  it('sends a test to a staff phone and confirms it', async () => {
    vi.mocked(sendAdminTemplateTest).mockResolvedValue({ accepted: true })
    show(positionalDetail(), 'en')

    const phone = await screen.findByLabelText('Staff phone number')
    const send = screen.getByRole('button', { name: 'Send test' })
    expect((send as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(phone, { target: { value: ' +201001234567 ' } })
    fireEvent.click(send)

    await waitFor(() =>
      expect(sendAdminTemplateTest).toHaveBeenCalledWith(
        EN_SHORT,
        '+201001234567'
      )
    )
    expect(
      (await screen.findByText('Test sent. Check WhatsApp.')).getAttribute(
        'role'
      )
    ).toBe('status')
  })

  it('explains a refused test send by its code', async () => {
    vi.mocked(sendAdminTemplateTest).mockRejectedValue(
      new AdminApiError(
        'no',
        403,
        'req-7',
        'WHATSAPP_TEMPLATE_TEST_PHONE_NOT_ALLOWED'
      )
    )
    show(positionalDetail(), 'ar')

    fireEvent.change(await screen.findByLabelText('رقم هاتف عضو الفريق'), {
      target: { value: '+201009999999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'إرسال اختبار' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('هذا الرقم ليس في قائمة اختبار الفريق.')
    expect(alert.textContent).toContain('req-7')
    expect(alert.textContent).not.toContain('201009999999')
  })

  it('offers no test send to staff who cannot send one', async () => {
    show(
      positionalDetail({
        ...templateContext({
          operations: {
            enabled: true,
            operator: false,
            test_send_available: false,
          },
        }),
      }),
      'en'
    )

    await screen.findByText('Please confirm your order.')
    expect(screen.queryByLabelText('Staff phone number')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Send test' })).toBeNull()
  })

  it.each([
    ['en', 'No template has this key', 'All templates'],
    ['ar', 'لا يوجد قالب بهذا المفتاح', 'كل القوالب'],
  ] as const)(
    'says so when the key is unknown, in %s',
    async (lang, title, back) => {
      vi.mocked(getAdminTemplate).mockRejectedValue(
        new AdminApiError('nf', 404, null, 'WHATSAPP_TEMPLATE_NOT_FOUND')
      )

      renderAdmin(
        <TemplateDetailAdminPage templateKey="cod_confirm.en.retired" />,
        lang
      )

      expect(await screen.findByText(title)).toBeTruthy()
      expect(
        screen.getByRole('link', { name: back }).getAttribute('href')
      ).toBe(`/${lang}/admin/templates`)
    }
  )

  it('shows a load error with a retry', async () => {
    vi.mocked(getAdminTemplate).mockRejectedValueOnce(
      new AdminApiError('boom', 500, 'req-9')
    )
    vi.mocked(getAdminTemplate).mockResolvedValue(positionalDetail())

    renderAdmin(<TemplateDetailAdminPage templateKey={EN_SHORT} />, 'en')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('The request failed. Try again.')
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Please confirm your order.')).toBeTruthy()
  })

  it('has no control that edits the template', async () => {
    show(positionalDetail(), 'en')
    await screen.findByText('Please confirm your order.')

    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.textContent)
        .sort()
    ).toEqual(['Refresh', 'Send test'])
  })
})
