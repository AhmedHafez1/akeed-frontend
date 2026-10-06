import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError } from './adminApi'
import { getTemplateImpact, runTemplateAction } from './adminTemplateDraftsApi'
import { renderAdmin, templateImpact } from './adminTemplatesTestUtils'
import { TemplateActionsPanel } from './TemplateActionsPanel'
import type { TemplateImpact } from './admin-template-drafts.model'

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

const KEY = 'cod_confirm.ar.egyptian'
const onChanged = vi.fn()

function show(
  impact: TemplateImpact,
  options: { operator?: boolean; lang?: 'ar' | 'en' } = {}
) {
  vi.mocked(getTemplateImpact).mockResolvedValue(impact)
  return renderAdmin(
    <TemplateActionsPanel
      templateKey={impact.key}
      language="ar"
      operator={options.operator ?? true}
      onChanged={onChanged}
    />,
    options.lang ?? 'en'
  )
}

const buttons = () =>
  screen.getAllByRole('button').map((button) => button.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('TemplateActionsPanel', () => {
  it('hides every write control from staff who are not operators', async () => {
    show(templateImpact(), { operator: false })

    await screen.findByText('12 stores select this template (11 active).')
    expect(screen.queryAllByRole('button')).toEqual([])
    expect(screen.queryByRole('link')).toBeNull()
  })

  it.each([
    [
      'an active, approved template',
      templateImpact(),
      ['Make default', 'Deactivate', 'Retire'],
    ],
    [
      'the language default',
      templateImpact({ is_default: true }),
      ['Deactivate', 'Retire'],
    ],
    [
      'an approved template that is not active',
      templateImpact({ is_active: false }),
      ['Activate', 'Retire'],
    ],
    [
      'a template Meta has not approved',
      templateImpact({ is_active: false, review_status: 'pending' }),
      ['Retire'],
    ],
  ])('offers an operator what %s allows', async (_case, impact, expected) => {
    show(impact)

    await screen.findByRole('button', { name: 'Retire' })
    expect(buttons()).toEqual(expected)
  })

  it('offers nothing for a retired template and says why', async () => {
    show(templateImpact({ retired: true, is_active: false }))

    expect(
      await screen.findByText(
        'This template is retired and can no longer be used.'
      )
    ).toBeTruthy()
    expect(screen.queryAllByRole('button')).toEqual([])
  })

  it("shows Meta's rejection reason in neutral words", async () => {
    show(
      templateImpact({
        is_active: false,
        review_status: 'rejected',
        rejection_reason: 'invalid_format',
      })
    )

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Meta rejected this templateInvalid format.')
  })

  it('states the effect of retiring: the stores that move, and where to', async () => {
    vi.mocked(runTemplateAction).mockResolvedValue({
      key: KEY,
      changed: true,
      is_active: false,
      is_default: false,
      retired: true,
      replacement_key: 'cod_confirm.ar.standard',
      moved_stores: 12,
    })
    show(templateImpact())

    fireEvent.click(await screen.findByRole('button', { name: 'Retire' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('12 stores select this template (11 active).')
    ).toBeTruthy()
    expect(
      within(dialog).getByText('A retired template cannot be activated again')
    ).toBeTruthy()
    const confirm = within(dialog).getByRole('button', { name: 'Retire' })
    // A template in use cannot be retired without naming its replacement.
    expect((confirm as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(within(dialog).getByLabelText('Replacement'), {
      target: { value: 'cod_confirm.ar.standard' },
    })
    expect(
      within(dialog).getByText('12 stores move to cod_confirm.ar.standard.')
    ).toBeTruthy()
    expect((confirm as HTMLButtonElement).disabled).toBe(false)
    expect(runTemplateAction).not.toHaveBeenCalled()

    fireEvent.click(confirm)

    await waitFor(() =>
      expect(runTemplateAction).toHaveBeenCalledWith(
        KEY,
        'retire',
        'cod_confirm.ar.standard'
      )
    )
    expect(
      await within(dialog).findByText(
        '12 stores moved to cod_confirm.ar.standard.'
      )
    ).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
  })

  it('says the replacement becomes the default when the default is withdrawn', async () => {
    show(templateImpact({ is_default: true }))

    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'It is the Arabic default. The replacement becomes the default.'
      )
    ).toBeTruthy()
  })

  it('needs no replacement for a template nothing sends', async () => {
    vi.mocked(runTemplateAction).mockResolvedValue({
      key: KEY,
      changed: true,
      is_active: false,
      is_default: false,
      retired: false,
      replacement_key: null,
      moved_stores: 0,
    })
    show(
      templateImpact({
        stores: { total: 0, active: 0 },
        requires_replacement: false,
      })
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('No store selects this template.')
    ).toBeTruthy()
    expect(within(dialog).queryByLabelText('Replacement')).toBeNull()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }))

    await waitFor(() =>
      expect(runTemplateAction).toHaveBeenCalledWith(
        KEY,
        'deactivate',
        undefined
      )
    )
  })

  it('says so when no template can replace one in use', async () => {
    show(templateImpact({ replacements: [] }))

    fireEvent.click(await screen.findByRole('button', { name: 'Retire' }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(/No approved, active template of this purpose/)
    ).toBeTruthy()
    expect(
      (
        within(dialog).getByRole('button', {
          name: 'Retire',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('states what making a template the default does, and reports a refusal by its code', async () => {
    vi.mocked(runTemplateAction).mockRejectedValue(
      new AdminApiError(
        'refused',
        409,
        'req-7',
        'WHATSAPP_TEMPLATE_NOT_APPROVED'
      )
    )
    show(templateImpact())

    fireEvent.click(await screen.findByRole('button', { name: 'Make default' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        /It replaces the current Arabic default in one step/
      )
    ).toBeTruthy()

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Make default' })
    )

    const alert = await within(dialog).findByRole('alert')
    expect(alert.textContent).toContain(
      'Only a template Meta has approved can be activated or made the default.'
    )
    expect(alert.textContent).toContain('req-7')
    expect(runTemplateAction).toHaveBeenCalledWith(
      KEY,
      'set-default',
      undefined
    )
  })

  it('states the effect in Arabic, right to left, with Arabic plural forms', async () => {
    show(templateImpact({ stores: { total: 12, active: 11 } }), {
      lang: 'ar',
    })

    fireEvent.click(await screen.findByRole('button', { name: 'تقاعد' }))
    const dialog = await screen.findByRole('dialog')
    expect(document.documentElement.dir).toBe('rtl')
    expect(
      within(dialog).getByText('12 متجرًا تختار هذا القالب (المفعّل: 11).')
    ).toBeTruthy()

    fireEvent.change(within(dialog).getByLabelText('البديل'), {
      target: { value: 'cod_confirm.ar.standard' },
    })

    expect(
      within(dialog).getByText('ينتقل 12 متجرًا إلى cod_confirm.ar.standard.')
    ).toBeTruthy()
  })

  it('links an operator to the text of a template written in Akeed', async () => {
    show(
      templateImpact({
        is_active: false,
        edit: {
          ...templateImpact().edit,
          allowed: true,
          refusal: null,
          rule: null,
          draft_id: 'draft-1',
        },
      })
    )

    expect(
      (await screen.findByRole('link', { name: 'Open text' })).getAttribute(
        'href'
      )
    ).toBe('/en/admin/templates/drafts/draft-1')
  })
})
