import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError } from './adminApi'
import {
  checkTemplateDraft,
  createTemplateDraft,
  discardTemplateDraft,
  editTemplateText,
  getTemplateDraft,
  getTemplateDrafts,
  getTemplateImpact,
  reconcileTemplateDraft,
  submitTemplateDraft,
  updateTemplateDraft,
} from './adminTemplateDraftsApi'
import {
  authoringContext,
  renderAdmin,
  templateDraft,
  templateDraftList,
  templateImpact,
} from './adminTemplatesTestUtils'
import {
  TemplateDraftEditorPage,
  TemplateDraftNewPage,
} from './TemplateDraftEditorPage'
import { TemplateDraftsPanel } from './TemplateDraftsPanel'
import type {
  TemplateDraft,
  TemplateDraftCheck,
  TemplateDraftIssue,
} from './admin-template-drafts.model'

vi.mock('./adminTemplateDraftsApi', () => ({
  getTemplateDrafts: vi.fn(),
  getTemplateDraft: vi.fn(),
  checkTemplateDraft: vi.fn(),
  createTemplateDraft: vi.fn(),
  updateTemplateDraft: vi.fn(),
  discardTemplateDraft: vi.fn(),
  submitTemplateDraft: vi.fn(),
  reconcileTemplateDraft: vi.fn(),
  getTemplateImpact: vi.fn(),
  editTemplateText: vi.fn(),
  runTemplateAction: vi.fn(),
}))

const NOT_OPERATOR = { operations: { enabled: true, operator: false } }

function check(issues: TemplateDraftIssue[] = []): TemplateDraftCheck {
  return {
    template_name: 'akeed_cod_confirm_warm_v1',
    key: 'cod_confirm.en.warm_v1',
    version: 1,
    variables: [],
    validation: {
      valid: issues.every((issue) => issue.severity !== 'error'),
      issues,
    },
  }
}

function showDraft(
  draft: TemplateDraft,
  options: { lang?: 'ar' | 'en'; context?: object } = {}
) {
  vi.mocked(getTemplateDraft).mockResolvedValue({
    ...authoringContext(options.context),
    draft,
  })
  return renderAdmin(
    <TemplateDraftEditorPage draftId={draft.id} />,
    options.lang ?? 'en'
  )
}

/** The bubble that carries the message text inside the phone preview. */
function bubble(text: string): HTMLElement {
  const holder = screen.getByText(text).closest('[dir]')
  if (!(holder instanceof HTMLElement)) throw new Error('no message bubble')
  return holder
}

const field = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.mocked(getTemplateDrafts).mockResolvedValue(templateDraftList())
  vi.mocked(checkTemplateDraft).mockResolvedValue(check())
  vi.mocked(getTemplateImpact).mockImplementation(
    () => new Promise<never>(() => undefined)
  )
})

describe('TemplateDraftsPanel', () => {
  it('lists drafts and offers a new one to an operator, naming the environment', async () => {
    vi.mocked(getTemplateDrafts).mockResolvedValue(
      templateDraftList([
        templateDraft(),
        templateDraft({
          id: 'draft-2',
          template_name: 'akeed_cod_confirm_warm_v2',
          state: 'submit_unknown',
        }),
      ])
    )
    renderAdmin(<TemplateDraftsPanel />, 'en')

    expect(
      (
        await screen.findByRole('link', { name: 'akeed_cod_confirm_warm_v1' })
      ).getAttribute('href')
    ).toBe('/en/admin/templates/drafts/3f1b6c1e-2d4a-4c3b-9a8e-1f2e3d4c5b6a')
    expect(screen.getByText('Needs a check at Meta')).toBeTruthy()
    expect(screen.getByText('Not production')).toBeTruthy()
    expect(screen.getByText(/Meta account ending in/).textContent).toBe(
      'Meta account ending in 0001'
    )
    expect(
      screen.getByRole('link', { name: 'New draft' }).getAttribute('href')
    ).toBe('/en/admin/templates/drafts/new')
  })

  it.each([
    [
      'not an operator',
      NOT_OPERATOR,
      'Only a named template operator can change templates. You can read them.',
    ],
    [
      'the switch is off',
      { operations: { enabled: false, operator: false } },
      'Template writes are off in this environment. You can read, not change.',
    ],
  ])(
    'offers no new draft when %s, and says why',
    async (_case, context, why) => {
      vi.mocked(getTemplateDrafts).mockResolvedValue(
        templateDraftList([templateDraft()], context)
      )
      renderAdmin(<TemplateDraftsPanel />, 'en')

      expect((await screen.findByRole('status')).textContent).toBe(why)
      expect(screen.queryByRole('link', { name: 'New draft' })).toBeNull()
    }
  )

  it('marks production clearly', async () => {
    vi.mocked(getTemplateDrafts).mockResolvedValue(
      templateDraftList([], {
        environment: { production: true, account_suffix: '4242' },
      })
    )
    renderAdmin(<TemplateDraftsPanel />, 'ar')

    expect(await screen.findByText('بيئة الإنتاج')).toBeTruthy()
    expect(screen.getByText('لا توجد مسودات بعد.')).toBeTruthy()
  })
})

describe('TemplateDraftNewPage', () => {
  it('previews the message live as the operator writes it', async () => {
    renderAdmin(<TemplateDraftNewPage />, 'en')
    await screen.findByLabelText('Body')
    fireEvent.change(field('Language'), { target: { value: 'en' } })

    fireEvent.change(field('Body'), {
      target: { value: 'Hello {{customer}},\n\nOrder {{order}} is ready.' },
    })
    fireEvent.change(field('Confirm button'), {
      target: { value: 'Confirm order' },
    })
    fireEvent.change(field('Cancel button'), {
      target: { value: 'Cancel order' },
    })

    const message = bubble('Hello Ahmed,')
    expect(message.getAttribute('dir')).toBe('ltr')
    expect(within(message).getByText('Order TEST-1 is ready.')).toBeTruthy()
    const preview = screen.getByRole('complementary', { name: 'Preview' })
    expect(within(preview).getByText('Confirm order')).toBeTruthy()
    expect(within(preview).getByText('Cancel order')).toBeTruthy()

    fireEvent.change(field('Customer name'), { target: { value: 'Sara' } })

    expect(bubble('Hello Sara,')).toBeTruthy()
  })

  it('offers only the supported values, and inserts one where the caret is', async () => {
    renderAdmin(<TemplateDraftNewPage />, 'en')
    const body = (await screen.findByLabelText('Body')) as HTMLTextAreaElement
    const picker = screen.getByRole('group', { name: 'Insert a value' })

    expect(
      within(picker)
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual(['Customer name', 'Store name', 'Order number', 'Order total'])

    fireEvent.change(body, { target: { value: 'Hello , welcome' } })
    body.setSelectionRange(6, 6)
    fireEvent.click(
      within(picker).getByRole('button', { name: 'Customer name' })
    )

    expect(body.value).toBe('Hello {{customer}}, welcome')
    // A sample field appears for the value the body now uses.
    expect(screen.getByLabelText('Customer name')).toBeTruthy()
    expect(screen.queryByLabelText('Order total')).toBeNull()
  })

  it.each([
    [
      'en',
      'Style',
      'Body',
      'The body may not start or end with a value.',
      '(contract record 4.6.8)',
      'Many values for so few words. Meta may reject this; add text or remove a value.',
    ],
    [
      'ar',
      'النمط',
      'نص الرسالة الأساسي',
      'لا يجوز أن يبدأ النص أو ينتهي بقيمة.',
      '(سجل العقد 4.6.8)',
      'قيم كثيرة مقابل كلمات قليلة. قد ترفضه ميتا؛ أضف نصًا أو احذف قيمة.',
    ],
  ] as const)(
    'shows each validation finding next to its field, in %s',
    async (lang, style, body, edge, finding, ratio) => {
      vi.mocked(checkTemplateDraft).mockResolvedValue(
        check([
          {
            field: 'body',
            rule: 'parameter_at_edge',
            finding: '4.6.8',
            severity: 'error',
          },
          {
            field: 'body',
            rule: 'parameter_ratio',
            finding: '4.6.14',
            severity: 'warning',
          },
          {
            field: 'style',
            rule: 'style_format',
            finding: 'akeed',
            severity: 'error',
          },
        ])
      )
      const { container } = renderAdmin(<TemplateDraftNewPage />, lang)
      const area = await screen.findByLabelText(body)

      fireEvent.change(area, { target: { value: '{{customer}} hi' } })

      const error = await screen.findByText(edge)
      expect(error.closest('li')?.getAttribute('role')).toBe('alert')
      expect(error.closest('li')?.textContent).toContain(finding)
      // A warning is shown, and is not an alert.
      expect(screen.getByText(ratio).closest('li')?.getAttribute('role')).toBe(
        'status'
      )
      expect(area.getAttribute('aria-invalid')).toBe('true')
      expect(area.getAttribute('aria-describedby')).toContain(
        'draft-body-issues'
      )
      expect(screen.getByLabelText(style).getAttribute('aria-invalid')).toBe(
        'true'
      )
      expect(container.querySelector('section')?.getAttribute('dir')).toBe(
        lang === 'ar' ? 'rtl' : 'ltr'
      )
      expect(checkTemplateDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({ body: '{{customer}} hi' }),
        undefined
      )
    }
  )

  it('writes the body in the direction of the template language, on a page of either locale', async () => {
    renderAdmin(<TemplateDraftNewPage />, 'en')
    const body = await screen.findByLabelText('Body')

    // Arabic is the default language of a new draft.
    expect(body.getAttribute('dir')).toBe('rtl')
    fireEvent.change(body, {
      target: { value: 'أهلاً {{customer}}، طلبك جاهز' },
    })
    expect(bubble('أهلاً أحمد، طلبك جاهز').getAttribute('dir')).toBe('rtl')
    expect(field('Customer name').value).toBe('أحمد')

    fireEvent.change(field('Language'), { target: { value: 'en' } })

    expect(body.getAttribute('dir')).toBe('ltr')
    expect(field('Meta language code').value).toBe('en')
  })

  it('shows the generated name and saves the draft without calling Meta', async () => {
    vi.mocked(createTemplateDraft).mockResolvedValue({
      draft: templateDraft(),
    })
    renderAdmin(<TemplateDraftNewPage />, 'en')
    await screen.findByLabelText('Body')

    fireEvent.change(field('Style'), { target: { value: 'warm' } })

    await waitFor(() =>
      expect(screen.getByTestId('draft-template-name').textContent).toBe(
        'akeed_cod_confirm_warm_v1'
      )
    )
    expect(screen.queryByRole('button', { name: 'Submit to Meta' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() =>
      expect(createTemplateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: 'cod_confirmation',
          language: 'ar',
          style: 'warm',
          parameter_format: 'named',
        })
      )
    )
    expect(submitTemplateDraft).not.toHaveBeenCalled()
  })

  it('hides every write control from staff who are not operators', async () => {
    vi.mocked(getTemplateDrafts).mockResolvedValue(
      templateDraftList([], NOT_OPERATOR)
    )
    renderAdmin(<TemplateDraftNewPage />, 'en')
    const body = (await screen.findByLabelText('Body')) as HTMLTextAreaElement

    expect(screen.getByRole('status').textContent).toBe(
      'Only a named template operator can change templates. You can read them.'
    )
    expect(body.disabled).toBe(true)
    expect(field('Style').disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull()
    expect(
      screen
        .getAllByRole('button')
        .every((button) => (button as HTMLButtonElement).disabled)
    ).toBe(true)
    // The validation endpoint is a write route too.
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(checkTemplateDraft).not.toHaveBeenCalled()
  })
})

describe('TemplateDraftEditorPage', () => {
  it('fixes purpose, language and style once a draft is saved', async () => {
    showDraft(templateDraft())
    await screen.findByLabelText('Body')

    expect(field('Purpose').disabled).toBe(true)
    expect(field('Language').disabled).toBe(true)
    expect(field('Style').disabled).toBe(true)
    expect(field('Body').disabled).toBe(false)
    expect(screen.getByTestId('draft-template-name').textContent).toBe(
      'akeed_cod_confirm_warm_v1'
    )
  })

  it('saves a change before it can be submitted', async () => {
    vi.mocked(updateTemplateDraft).mockImplementation((_id, form) =>
      Promise.resolve({ draft: templateDraft({ body: form.body }) })
    )
    showDraft(templateDraft())
    const submit = (await screen.findByRole('button', {
      name: 'Submit to Meta',
    })) as HTMLButtonElement
    await waitFor(() => expect(submit.disabled).toBe(false))

    fireEvent.change(field('Body'), {
      target: { value: 'Hi {{customer}}, confirm order {{order}} please now.' },
    })

    expect(submit.disabled).toBe(true)
    expect(screen.getByText('You have unsaved changes.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => expect(submit.disabled).toBe(false))
    expect(updateTemplateDraft).toHaveBeenCalledWith(
      templateDraft().id,
      expect.objectContaining({
        body: 'Hi {{customer}}, confirm order {{order}} please now.',
      })
    )
  })

  it('does not offer a submit while the draft fails validation', async () => {
    vi.mocked(checkTemplateDraft).mockResolvedValue(
      check([
        {
          field: 'cancel_label',
          rule: 'button_label_too_long',
          finding: '4.7.2',
          severity: 'error',
        },
      ])
    )
    showDraft(templateDraft())

    expect(
      await screen.findByText('A button label is at most 25 characters.')
    ).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: 'Submit to Meta',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(
      screen.getByText('Fix the marked fields before submitting.')
    ).toBeTruthy()
  })

  it.each([
    [
      'en',
      'Submit to Meta',
      'Review can take up to 24 hours.',
      /Meta may assign another one now, or move the template to marketing later/,
      'Not production',
      'Submit for review',
      'Submitted to Meta for review.',
    ],
    [
      'ar',
      'إرسال إلى ميتا',
      'قد تستغرق المراجعة حتى 24 ساعة.',
      /قد تعيّن ميتا فئة أخرى الآن أو تنقل القالب إلى التسويق لاحقًا/,
      'بيئة غير الإنتاج',
      'إرسال للمراجعة',
      'أُرسل إلى ميتا للمراجعة.',
    ],
  ] as const)(
    'confirms a submit by stating review time, category risk and the environment, in %s',
    async (lang, open, time, risk, environment, confirm, done) => {
      vi.mocked(submitTemplateDraft).mockResolvedValue({
        outcome: 'created',
        draft: templateDraft({
          state: 'submitted',
          template_key: 'cod_confirm.en.warm_v1',
        }),
      })
      showDraft(templateDraft(), { lang })
      const button = (await screen.findByRole('button', {
        name: open,
      })) as HTMLButtonElement
      await waitFor(() => expect(button.disabled).toBe(false))

      fireEvent.click(button)

      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText(time)).toBeTruthy()
      expect(within(dialog).getByText(risk)).toBeTruthy()
      expect(within(dialog).getByText(environment)).toBeTruthy()
      expect(
        within(dialog).getByText('akeed_cod_confirm_warm_v1 [en]')
      ).toBeTruthy()
      // Opening the dialog sends nothing.
      expect(submitTemplateDraft).not.toHaveBeenCalled()

      fireEvent.click(within(dialog).getByRole('button', { name: confirm }))

      expect(await within(dialog).findByText(done)).toBeTruthy()
      expect(submitTemplateDraft).toHaveBeenCalledTimes(1)
      expect(submitTemplateDraft).toHaveBeenCalledWith(templateDraft().id)
    }
  )

  it("shows Meta's refusal of a submit with its neutral reason", async () => {
    vi.mocked(submitTemplateDraft).mockRejectedValue(
      new AdminApiError(
        'refused',
        422,
        'req-3',
        'WHATSAPP_TEMPLATE_SUBMIT_REJECTED',
        { reason: 'parameter_ratio' }
      )
    )
    showDraft(templateDraft())
    const button = (await screen.findByRole('button', {
      name: 'Submit to Meta',
    })) as HTMLButtonElement
    await waitFor(() => expect(button.disabled).toBe(false))
    fireEvent.click(button)
    const dialog = await screen.findByRole('dialog')

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Submit for review' })
    )

    expect(
      await within(dialog).findByText('Meta did not accept the template.')
    ).toBeTruthy()
    expect(
      within(dialog).getByText(
        'Meta says there are too many values for the amount of text.'
      )
    ).toBeTruthy()
  })

  it('offers a check at Meta, and nothing else, after a submit with no answer', async () => {
    vi.mocked(reconcileTemplateDraft).mockResolvedValue({
      outcome: 'adopted',
      draft: templateDraft({ state: 'submitted' }),
    })
    showDraft(templateDraft({ state: 'submit_unknown' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Meta did not answer the last submit')
    expect(screen.queryByRole('button', { name: 'Submit to Meta' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull()
    expect(field('Body').disabled).toBe(true)

    fireEvent.click(
      within(alert).getByRole('button', { name: 'Check at Meta' })
    )

    await waitFor(() =>
      expect(reconcileTemplateDraft).toHaveBeenCalledWith(templateDraft().id)
    )
    expect(submitTemplateDraft).not.toHaveBeenCalled()
  })

  it('tracks review: in review, then rejected with the reason and an edit', async () => {
    const submitted = templateDraft({
      state: 'submitted',
      template_key: 'cod_confirm.en.warm_v1',
    })
    vi.mocked(getTemplateImpact).mockResolvedValue(
      templateImpact({
        key: 'cod_confirm.en.warm_v1',
        is_active: false,
        review_status: 'pending',
        edit: {
          ...templateImpact().edit,
          refusal: 'status_not_editable',
          rule: '4.3.1',
        },
      })
    )
    const { unmount } = showDraft(submitted)

    const review = await screen.findByRole('region', {
      name: 'Review at Meta',
    })
    expect(within(review).getByText('In review')).toBeTruthy()
    expect(
      within(review).getByText(/A decision can take up to 24 hours/)
    ).toBeTruthy()
    expect(
      within(review).getByText(
        /Meta accepts edits only for approved, rejected or paused templates/
      ).textContent
    ).toContain('(contract record 4.3.1)')
    expect(within(review).queryByRole('button')).toBeNull()
    expect(
      screen
        .getByRole('link', { name: 'cod_confirm.en.warm_v1' })
        .getAttribute('href')
    ).toBe('/en/admin/templates/cod_confirm.en.warm_v1')
    unmount()

    vi.mocked(getTemplateImpact).mockResolvedValue(
      templateImpact({
        key: 'cod_confirm.en.warm_v1',
        is_active: false,
        review_status: 'rejected',
        rejection_reason: 'invalid_format',
        edit: {
          ...templateImpact().edit,
          allowed: true,
          refusal: null,
          rule: null,
        },
      })
    )
    showDraft(submitted)

    const rejected = await screen.findByRole('alert')
    expect(rejected.textContent).toBe(
      'Meta rejected this templateInvalid format.'
    )
    expect(screen.getByRole('button', { name: 'Edit text' })).toBeTruthy()
  })

  it('warns that an edit takes the template out of use before it is sent', async () => {
    vi.mocked(getTemplateImpact).mockResolvedValue(
      templateImpact({
        key: 'cod_confirm.en.warm_v1',
        is_active: false,
        review_status: 'approved',
        edit: {
          ...templateImpact().edit,
          allowed: true,
          refusal: null,
          rule: null,
          edits_last_30_days: 3,
        },
      })
    )
    vi.mocked(editTemplateText).mockResolvedValue({
      key: 'cod_confirm.en.warm_v1',
      review_status: 'pending',
    })
    showDraft(
      templateDraft({
        state: 'submitted',
        template_key: 'cod_confirm.en.warm_v1',
      })
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Edit text' }))
    // Only the text opens for an edit: name, language and format are fixed.
    expect(field('Body').disabled).toBe(false)
    expect(field('Meta language code').disabled).toBe(true)
    expect(field('Parameter format').disabled).toBe(true)
    fireEvent.change(field('Body'), {
      target: { value: 'Hi {{customer}}, confirm order {{order}} please now.' },
    })
    const send = screen.getByRole('button', {
      name: 'Review and send edit',
    }) as HTMLButtonElement
    await waitFor(() => expect(send.disabled).toBe(false))
    fireEvent.click(send)

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'This template cannot be sent until Meta approves it again'
      )
    ).toBeTruthy()
    expect(within(dialog).getByText(/Plan for up to 24 hours/)).toBeTruthy()
    expect(
      within(dialog).getByText(/Used in the last 30 days: 3\./)
    ).toBeTruthy()
    expect(editTemplateText).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Send edit' }))

    expect(
      await within(dialog).findByText('Edit sent. The template is in review.')
    ).toBeTruthy()
    expect(editTemplateText).toHaveBeenCalledWith(
      'cod_confirm.en.warm_v1',
      expect.objectContaining({
        body: 'Hi {{customer}}, confirm order {{order}} please now.',
      })
    )
  })

  it('discards a draft only after a confirmation that says nothing is deleted at Meta', async () => {
    vi.mocked(discardTemplateDraft).mockResolvedValue({ discarded: true })
    showDraft(templateDraft())

    fireEvent.click(
      await screen.findByRole('button', { name: 'Discard draft' })
    )
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'The draft is removed from Akeed. Nothing is deleted at Meta.'
      )
    ).toBeTruthy()
    expect(discardTemplateDraft).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard' }))

    await waitFor(() =>
      expect(discardTemplateDraft).toHaveBeenCalledWith(templateDraft().id)
    )
  })

  it('shows a saved draft read-only to staff who are not operators', async () => {
    showDraft(templateDraft(), { context: NOT_OPERATOR })
    await screen.findByLabelText('Body')

    expect(field('Body').disabled).toBe(true)
    expect(field('Confirm button').disabled).toBe(true)
    for (const name of ['Save draft', 'Submit to Meta', 'Discard draft']) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
    expect(
      bubble(
        'Hello Ahmed, please confirm your order TEST-1 from our store today.'
      )
    ).toBeTruthy()
  })

  it('renders an Arabic draft right to left, with the page in Arabic', async () => {
    const { container } = showDraft(
      templateDraft({
        language: 'ar',
        language_code: 'ar',
        key: 'cod_confirm.ar.warm_v1',
        body: 'أهلاً {{customer}}، من فضلك أكّد طلبك رقم {{order}} اليوم.',
        confirm_label: 'تأكيد الطلب',
        cancel_label: 'إلغاء الطلب',
        samples: { customer: 'أحمد', order: 'TEST-1' },
      }),
      { lang: 'ar' }
    )

    const body = await screen.findByLabelText('نص الرسالة الأساسي')
    expect(container.querySelector('section')?.getAttribute('dir')).toBe('rtl')
    expect(body.getAttribute('dir')).toBe('rtl')
    expect(
      bubble('أهلاً أحمد، من فضلك أكّد طلبك رقم TEST-1 اليوم.').getAttribute(
        'dir'
      )
    ).toBe('rtl')
    // Names Meta holds stay left to right inside the Arabic page.
    expect(screen.getByTestId('draft-template-name').getAttribute('dir')).toBe(
      'ltr'
    )
    expect(screen.getByRole('button', { name: 'حفظ المسودة' })).toBeTruthy()
    expect(screen.getByText('مسودة')).toBeTruthy()
  })

  it('says so when no draft has this ID', async () => {
    vi.mocked(getTemplateDraft).mockRejectedValue(
      new AdminApiError(
        'missing',
        404,
        null,
        'WHATSAPP_TEMPLATE_DRAFT_NOT_FOUND'
      )
    )
    renderAdmin(<TemplateDraftEditorPage draftId="nope" />, 'en')

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No draft has this ID.'
    )
  })
})
