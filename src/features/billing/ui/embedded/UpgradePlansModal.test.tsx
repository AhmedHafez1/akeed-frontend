import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import type { ShopifyPlansResponse } from '@/features/billing/domain/shopifyPlans'
import { UpgradePlansModal } from './UpgradePlansModal'

const api = vi.hoisted(() => ({
  fetchShopifyPlans: vi.fn(),
  createShopifySubscription: vi.fn(),
}))

vi.mock('../../api/shopifyPlansApi', () => api)

function plansResponse(isFreePlanClaimed: boolean): ShopifyPlansResponse {
  return {
    billingManagement: { mode: 'shopify', canManageBilling: true },
    plans: [
      {
        id: 'starter',
        name: 'Akeed Starter',
        amount: 0,
        currencyCode: 'USD',
        includedVerifications: 30,
      },
      {
        id: 'basic',
        name: 'Akeed Basic',
        amount: 9.99,
        currencyCode: 'USD',
        includedVerifications: 300,
      },
      {
        id: 'pro',
        name: 'Akeed Pro',
        amount: 22.99,
        currencyCode: 'USD',
        includedVerifications: 1000,
      },
      {
        id: 'business',
        name: 'Akeed Scale',
        amount: 49.99,
        currencyCode: 'USD',
        includedVerifications: 2500,
      },
    ],
    isFreePlanClaimed,
  }
}

async function renderModal(isFreePlanClaimed = true) {
  api.fetchShopifyPlans.mockResolvedValue(plansResponse(isFreePlanClaimed))
  const onClose = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  renderEmbedded(
    <QueryClientProvider client={client}>
      <UpgradePlansModal
        open
        title="اختر باقتك"
        hostParam="host-1"
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  await screen.findByRole('radiogroup', { name: 'الباقات' })
  return { onClose }
}

const radio = (name: string) =>
  screen.getByRole('radio', { name }) as HTMLInputElement

const FREE_USED =
  /الباقة المجانية \(30 رسالة لمرة واحدة\) استُخدمت في هذا المتجر\./

beforeEach(() => {
  vi.clearAllMocks()
  api.createShopifySubscription.mockResolvedValue({
    confirmationUrl: '#approved',
  })
})

describe('UpgradePlansModal', () => {
  it('offers the three paid plans when the free plan is used', async () => {
    await renderModal(true)

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(radio('الأساسية').checked).toBe(true)
    expect(radio('الاحترافية').checked).toBe(false)
    expect(radio('المتقدمة').checked).toBe(false)
    expect(screen.getByText(FREE_USED)).toBeTruthy()
    expect(screen.queryByText('البداية: 30 رسالة مجانية لمرة واحدة')).toBeNull()

    expect(screen.getByText('US$ 49.99')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(
      screen.getByText('ستنتقل إلى شوبيفاي للموافقة على الفاتورة.')
    ).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: /^اشترك في الأساسية · .US\$ 9\.99. شهرياً$/,
      })
    ).toBeTruthy()
    expect(screen.queryByText('موصى بها')).toBeNull()
  })

  it('names the selected plan and its price on the primary action', async () => {
    await renderModal(true)

    fireEvent.click(radio('الاحترافية'))

    expect(radio('الاحترافية').checked).toBe(true)
    expect(radio('الأساسية').checked).toBe(false)
    expect(
      screen.getByRole('button', {
        name: /^اشترك في الاحترافية · .US\$ 22\.99. شهرياً$/,
      })
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: /اشترك في الأساسية/ })
    ).toBeNull()
  })

  it('activates the selected plan', async () => {
    await renderModal(true)
    fireEvent.click(radio('المتقدمة'))

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /اشترك في المتقدمة/ }))
    })

    expect(api.createShopifySubscription).toHaveBeenCalledTimes(1)
    expect(api.createShopifySubscription).toHaveBeenCalledWith(
      'business',
      'host-1'
    )
  })

  it('keeps Starter selectable while the store can still claim it', async () => {
    await renderModal(false)

    expect(screen.getAllByRole('radio')).toHaveLength(4)
    expect(radio('الأساسية').checked).toBe(true)
    expect(screen.queryByText(FREE_USED)).toBeNull()

    fireEvent.click(radio('البداية: 30 رسالة مجانية لمرة واحدة'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'ابدأ مجاناً' }))
    })

    expect(api.createShopifySubscription).toHaveBeenCalledWith(
      'starter',
      'host-1'
    )
  })

  it('cancels through the secondary action', async () => {
    const { onClose } = await renderModal(true)

    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(api.createShopifySubscription).not.toHaveBeenCalled()
  })
})
