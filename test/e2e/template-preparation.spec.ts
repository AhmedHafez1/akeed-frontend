import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
const id = '11111111-1111-4111-8111-111111111111'
const labels = {
  ar: 'طلب تعديل',
  en: 'Request a change',
  ur: 'تبدیلی کی درخواست',
  es: 'Solicitar un cambio',
  fr: 'Demander une modification',
  tr: 'Değişiklik iste',
}
for (const language of Object.keys(labels) as (keyof typeof labels)[])
  test(`production admin three-button review ${language}`, async ({ page }) => {
    const third = labels[language]
    const direction = language === 'ar' || language === 'ur' ? 'rtl' : 'ltr'
    const body =
      'Hello {{customer}}, please confirm order {{order}} from our store today.'
    let draft = {
      id,
      key: `cod_confirm.${language}.change_test_v1`,
      purpose: 'cod_confirmation',
      language,
      style: 'change_test',
      version: 1,
      template_name: 'akeed_cod_confirm_change_test_v1',
      language_code: language,
      parameter_format: 'named',
      category: 'utility',
      body,
      confirm_label: 'Confirm',
      cancel_label: 'Cancel',
      change_label: third,
      change_request_of_key: `cod_confirm.${language}.short`,
      samples: { customer: 'Ahmed', order: 'TEST-1' },
      state: 'draft',
      state_changed_at: '2026-11-09T09:00:00Z',
      last_error_code: null,
      template_key: null,
      created_at: '2026-11-09T09:00:00Z',
      updated_at: '2026-11-09T09:00:00Z',
      variables: [
        { variable: 'customer', parameter: 'customer', sample: 'Ahmed' },
        { variable: 'order', parameter: 'order', sample: 'TEST-1' },
      ],
      validation: { valid: true, issues: [] },
      preview: {
        paragraphs: [
          'Hello Ahmed, please confirm order TEST-1 from our store today.',
        ],
        buttons: [
          { label: 'Confirm', kind: 'quick_reply' },
          { label: 'Cancel', kind: 'quick_reply' },
          { label: third, kind: 'quick_reply' },
        ],
        direction,
      },
    }
    const context = {
      operations: { enabled: true, operator: true },
      environment: { production: true, account_suffix: '0001' },
      options: {
        purposes: ['cod_confirmation', 'cod_reminder'],
        language_codes: Object.fromEntries(
          Object.keys(labels).map((l) => [l, [l]])
        ),
        variables: [
          'customer',
          'store',
          'order',
          'total',
          'items',
          'region',
          'address',
        ],
        sample_defaults: Object.fromEntries(
          Object.keys(labels).map((l) => [
            l,
            {
              customer: 'Ahmed',
              store: 'Example Store',
              order: 'TEST-1',
              total: '100',
              items: 'Item',
              region: 'Region',
              address: 'Address',
            },
          ])
        ),
        category: { cod_confirmation: 'utility', cod_reminder: 'utility' },
        limits: { body: 1024, button_label: 25, style: 24 },
        review_max_hours: 24,
      },
    }
    const calls: string[] = []
    await page.route('**/api/admin/templates/**', async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname
      calls.push(request.method() + ' ' + path)
      if (path.endsWith('/change-requests'))
        return route.fulfill({
          json: {
            variants: [
              {
                parent_key: draft.change_request_of_key,
                language,
                style: 'short',
                purpose: draft.purpose,
                draft_id: id,
                key: draft.key,
                state: 'draft',
                review_status: null,
                active: false,
                blocked_reason: null,
                differences: [],
                validation: draft.validation,
                content: {
                  templateName: draft.template_name,
                  languageCode: language,
                  parameterFormat: 'named',
                  category: 'utility',
                  body: draft.body,
                  confirmLabel: 'Confirm',
                  cancelLabel: 'Cancel',
                  changeLabel: third,
                  samples: draft.samples,
                },
                image_twin: {
                  key: draft.key + '_logo',
                  template_name: draft.template_name + '_logo',
                  state: 'planned',
                  review_status: null,
                  active: false,
                  header: 'IMAGE',
                  parent_key: draft.key,
                },
              },
            ],
            draft_only_sources: [],
          },
        })
      if (path.endsWith('/drafts/validate'))
        return route.fulfill({
          json: {
            template_name: draft.template_name,
            key: draft.key,
            version: 1,
            variables: draft.variables,
            validation: draft.validation,
          },
        })
      if (request.method() === 'PATCH') {
        const patch = request.postDataJSON()
        draft = { ...draft, ...patch, updated_at: '2026-11-09T10:00:00Z' }
        return route.fulfill({ json: { draft } })
      }
      if (path.endsWith('/submit'))
        return route.fulfill({
          json: { outcome: 'created', draft: { ...draft, state: 'submitted' } },
        })
      return route.fulfill({ json: { ...context, draft } })
    })
    await page.setViewportSize({
      width: language === 'ar' ? 390 : 1280,
      height: 1000,
    })
    await page.goto(
      `/${language === 'ar' ? 'ar' : 'en'}/admin-template-preparation`
    )
    if (language === 'ar')
      await page.evaluate(() => document.documentElement.classList.add('dark'))
    await expect(page.locator('#draft-change')).toHaveValue(third)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page
        .getByRole('button', {
          name: language === 'ar' ? 'تصدير المراجعة' : 'Export review',
          exact: true,
        })
        .click(),
    ])
    const exported = readFileSync((await download.path())!, 'utf8')
    expect(exported).toContain(third)
    expect(exported).toContain(draft.change_request_of_key)
    expect(exported).toContain(draft.template_name)
    await expect(page.locator('#draft-change')).toHaveAttribute('readonly', '')
    await page.locator('#draft-body').fill(body + ' Updated wording.')
    await page
      .getByRole('button', {
        name: language === 'ar' ? 'حفظ المسودة' : 'Save draft',
        exact: true,
      })
      .click()
    await expect(
      page.getByRole('button', {
        name: language === 'ar' ? 'إرسال إلى ميتا' : 'Submit to Meta',
        exact: true,
      })
    ).toBeEnabled()
    await page
      .getByRole('button', {
        name: language === 'ar' ? 'إرسال إلى ميتا' : 'Submit to Meta',
        exact: true,
      })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(third)
    await expect(dialog).toContainText('Updated wording.')
    await expect(dialog).toContainText(draft.change_request_of_key)
    await expect(dialog).toContainText('TEST-1')
    expect(calls.some((c) => c.endsWith('/submit'))).toBe(false)
    await page.screenshot({
      path: `.tmp/template-preparation-browser/${language}-submission.png`,
      fullPage: true,
    })
    await dialog
      .getByRole('button', {
        name: language === 'ar' ? 'إرسال للمراجعة' : 'Submit for review',
        exact: true,
      })
      .click()
    await expect
      .poll(() => calls.filter((c) => c.endsWith('/submit')).length)
      .toBe(1)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
