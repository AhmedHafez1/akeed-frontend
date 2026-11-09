import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { renderAdmin } from './adminTemplatesTestUtils'
import { ChangePreparationPanel } from './ChangePreparationPanel'
import {
  getChangePreparation,
  prepareChangeDrafts,
  changePreparationMarkdown,
  type ChangePreparationOverview,
} from './adminChangePreparationApi'
vi.mock('./adminChangePreparationApi', async (original) => ({
  ...(await original<typeof import('./adminChangePreparationApi')>()),
  getChangePreparation: vi.fn(),
  prepareChangeDrafts: vi.fn(),
}))
const overview: ChangePreparationOverview = {
  draft_only_sources: [],
  variants: [
    {
      parent_key: 'cod_confirm.en.short',
      language: 'en',
      style: 'short',
      purpose: 'cod_confirmation',
      key: 'cod_confirm.en.change_v1',
      draft_id: 'draft-one',
      state: 'draft',
      review_status: null,
      active: false,
      blocked_reason: null,
      differences: [],
      validation: { valid: true },
      content: {
        templateName: 'test_change_v1',
        languageCode: 'en',
        parameterFormat: 'positional',
        category: 'utility',
        body: 'Order {{order}} is ready.',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        changeLabel: 'Request a change',
        samples: { order: 'TEST-1' },
      },
      image_twin: {
        key: 'cod_confirm.en.change_v1_logo',
        template_name: 'test_change_v1_logo',
        state: 'planned',
        review_status: null,
        active: false,
        header: 'IMAGE',
        parent_key: 'cod_confirm.en.change_v1',
      },
    },
  ],
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getChangePreparation).mockResolvedValue(overview)
  vi.mocked(prepareChangeDrafts).mockResolvedValue({
    results: [{ parent_key: 'cod_confirm.en.short', outcome: 'reused' }],
  })
})
it('reviews all three labels, source identity, samples and planned logo without calling Meta', async () => {
  renderAdmin(
    <ChangePreparationPanel operator={false} onPrepared={vi.fn()} />,
    'en'
  )
  await screen.findByText('Original templates: 1')
  fireEvent.click(screen.getByText('en · short · cod_confirmation'))
  expect(screen.getByText('Request a change')).toBeTruthy()
  expect(screen.getByText('TEST-1')).toBeTruthy()
  expect(
    screen.queryByRole('button', { name: 'Prepare missing drafts' })
  ).toBeNull()
  expect(prepareChangeDrafts).not.toHaveBeenCalled()
  const markdown = changePreparationMarkdown(overview)
  expect(markdown).toContain('Confirm → Cancel → Request a change')
  expect(markdown).toContain('test_change_v1_logo')
  expect(markdown).toContain('independently approved text copies only')
})
it('prepares only through the authorized draft action and refreshes the draft list', async () => {
  const refresh = vi.fn()
  renderAdmin(<ChangePreparationPanel operator onPrepared={refresh} />, 'en')
  await screen.findByText('Original templates: 1')
  fireEvent.click(
    screen.getByRole('button', { name: 'Prepare missing drafts' })
  )
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  expect(prepareChangeDrafts).toHaveBeenCalledOnce()
})
