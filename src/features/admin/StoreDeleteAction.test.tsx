import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminApiError } from './adminApi'
import { StoreDeleteAction } from './StoreDeleteAction'

const api = vi.hoisted(() => ({ remove: vi.fn() }))
vi.mock('./adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./adminApi')>()),
  deleteAdminStore: api.remove,
}))

function renderAction(onDeleted = vi.fn()) {
  render(
    <StoreDeleteAction
      integrationId="int-1"
      storeName="Dead Store"
      onDeleted={onDeleted}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Delete store' }))
  return onDeleted
}

const confirmButton = () =>
  screen.getByRole('button', { name: 'Delete permanently' })

describe('StoreDeleteAction', () => {
  beforeEach(() => {
    api.remove.mockReset()
  })

  it('deletes only after the store name is typed', async () => {
    api.remove.mockResolvedValue({
      deleted: true,
      logins_removed: 1,
      logins_failed: 0,
    })
    const onDeleted = renderAction()

    expect((confirmButton() as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Type the store name to confirm'), {
      target: { value: 'Dead Store' },
    })
    fireEvent.click(confirmButton())

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(api.remove).toHaveBeenCalledWith('int-1', 'Dead Store')
  })

  it('explains a store that no longer qualifies', async () => {
    api.remove.mockRejectedValue(
      new AdminApiError(
        'This store cannot be deleted.',
        409,
        'req-1',
        'ADMIN_STORE_DELETE_NOT_ELIGIBLE'
      )
    )
    const onDeleted = renderAction()
    fireEvent.change(screen.getByLabelText('Type the store name to confirm'), {
      target: { value: 'Dead Store' },
    })
    fireEvent.click(confirmButton())

    expect((await screen.findByRole('alert')).textContent).toContain(
      'can no longer be deleted'
    )
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
