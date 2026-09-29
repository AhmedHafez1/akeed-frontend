import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/shared/query/keys'
import ar from '../../../../../public/messages/ar.json'
import { ManualOrderAction } from './ManualOrderTopBarAction'

const replace = vi.fn()
let search = 'new-order=1'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/ar/dashboard',
  useSearchParams: () => new URLSearchParams(search),
}))

function renderAction(canCreate: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(queryKeys.verifications.pageContext(), {
    page_context: {
      source: { status: 'connected' },
      permissions: { can_create_manual_order: true },
      usage: {
        limit: 0,
        remaining: 0,
        credit_denial: canCreate ? null : 'INSUFFICIENT_CREDITS',
      },
    },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
        <ManualOrderAction variant="tile" />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  replace.mockClear()
  search = 'new-order=1'
})

describe('ManualOrderAction and ?new-order=1', () => {
  it('opens the manual order dialog on arrival, then removes the param', async () => {
    renderAction(true)

    expect(await screen.findByRole('dialog')).toBeTruthy()
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/ar/dashboard', { scroll: false })
    )
  })

  it('stays closed without the param', () => {
    search = ''
    renderAction(true)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'تأكيد طلب' })).toBeTruthy()
  })

  it('drops the request when the order would be rejected', async () => {
    renderAction(false)

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/ar/dashboard', { scroll: false })
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
