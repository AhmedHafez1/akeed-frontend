import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNewOrderRequest } from './useNewOrderRequest'

const replace = vi.fn()
let search = 'new-order=1&tab=all'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/ar/dashboard',
  useSearchParams: () => new URLSearchParams(search),
}))

beforeEach(() => {
  replace.mockClear()
  search = 'new-order=1&tab=all'
})

describe('useNewOrderRequest', () => {
  it('asks to open the dialog and removes only its own param once opened', () => {
    const { result } = renderHook(() =>
      useNewOrderRequest({ isGateKnown: true, canOpen: true })
    )

    expect(result.current.shouldAutoOpen).toBe(true)
    expect(replace).not.toHaveBeenCalled()

    result.current.onAutoOpened()
    expect(replace).toHaveBeenCalledWith('/ar/dashboard?tab=all', {
      scroll: false,
    })
  })

  it('waits while the gate is still loading', () => {
    const { result } = renderHook(() =>
      useNewOrderRequest({ isGateKnown: false, canOpen: false })
    )

    expect(result.current.shouldAutoOpen).toBe(false)
    expect(replace).not.toHaveBeenCalled()
  })

  it('drops a request the gate cannot honour, so a refresh never retries it', () => {
    search = 'new-order=1'
    const { result } = renderHook(() =>
      useNewOrderRequest({ isGateKnown: true, canOpen: false })
    )

    expect(result.current.shouldAutoOpen).toBe(false)
    expect(replace).toHaveBeenCalledWith('/ar/dashboard', { scroll: false })
  })

  it('does nothing without the param', () => {
    search = 'tab=all'
    const { result } = renderHook(() =>
      useNewOrderRequest({ isGateKnown: true, canOpen: true })
    )

    expect(result.current.shouldAutoOpen).toBe(false)
    expect(replace).not.toHaveBeenCalled()
  })
})
