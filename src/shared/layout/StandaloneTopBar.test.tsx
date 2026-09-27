import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StandaloneTopBar } from './StandaloneTopBar'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/features/order-imports', () => ({
  ImportTopBarAction: () => <button type="button">Import orders</button>,
  useImportOutcomeSync: vi.fn(),
}))

vi.mock('@/features/orders', () => ({ ManualOrderTopBarAction: () => null }))
vi.mock('@/shared/theme', () => ({ ThemeToggle: () => null }))
vi.mock('./LocaleToggle', () => ({ LocaleToggle: () => null }))

describe('StandaloneTopBar', () => {
  it('keeps the import action without exposing a progress chip', () => {
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Import orders' })).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
