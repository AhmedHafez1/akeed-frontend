import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import { ApiError } from '@/shared/lib/http'
import type {
  IntegrationApiKey,
  IntegrationApiKeyList,
} from '../../../api/integrationKeysApi'
import { ApiKeysTab } from './ApiKeysTab'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('@/shared/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/auth')>()),
  api,
}))

vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({
    mode: 'STANDALONE',
    isEmbedded: false,
    isStandalone: true,
    isLoading: false,
    shopify: null,
  }),
}))

vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/ui')>()),
  notify: toast,
}))

const copy = ar.settings.standalone.page.apiKeys
const SECRET = 'ak_live_new00001_Q2hhbmdlTWVJbkFUZXN0T25seU5vdEFSZWFsS2V5MDAw'

function key(overrides: Partial<IntegrationApiKey> = {}): IntegrationApiKey {
  return {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    name: 'موقع المتجر',
    prefix: 'ak_live_abcd1234',
    status: 'active',
    createdAt: '2026-10-01T10:00:00.000Z',
    lastUsedAt: null,
    revokedAt: null,
    ...overrides,
  }
}

function listOf(
  keys: IntegrationApiKey[],
  maxActive = 5
): IntegrationApiKeyList {
  return { keys, maxActive }
}

const writeText = vi.fn()
let client: QueryClient

function renderTab(readOnly = false) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  )
  return render(<ApiKeysTab readOnly={readOnly} />, { wrapper })
}

const createButton = () =>
  screen.getByRole('button', { name: copy.createButton })

async function openCreateAndSubmit(name: string) {
  fireEvent.click(createButton())
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText(copy.create.nameLabel), {
    target: { value: name },
  })
  fireEvent.click(
    within(dialog).getByRole('button', { name: copy.create.submit })
  )
  return dialog
}

beforeEach(() => {
  vi.clearAllMocks()
  writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  api.get.mockResolvedValue(
    listOf([
      key(),
      key({
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        name: 'الخادم القديم',
        prefix: 'ak_live_old00000',
        status: 'revoked',
        revokedAt: '2026-10-02T09:00:00.000Z',
      }),
    ])
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ApiKeysTab', () => {
  it('lists key metadata with the prefix only and revoke on active keys', async () => {
    renderTab()

    const list = await screen.findByRole('list', { name: copy.listLabel })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('موقع المتجر')).toBeTruthy()
    expect(
      within(rows[0]).getByText('ak_live_abcd1234_…').getAttribute('dir')
    ).toBe('ltr')
    expect(within(rows[0]).getByText(copy.status.active)).toBeTruthy()
    expect(within(rows[1]).getByText(copy.status.revoked)).toBeTruthy()
    expect(
      within(rows[0]).getByRole('button', { name: /موقع المتجر/ })
    ).toBeTruthy()
    expect(within(rows[1]).queryByRole('button')).toBeNull()
    expect(api.get).toHaveBeenCalledWith('/api/integration-keys', {
      signal: expect.any(AbortSignal),
    })
  })

  it('shows when each key was last used and when it was revoked', async () => {
    api.get.mockResolvedValue(
      listOf([
        key(),
        key({
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          name: 'الخادم القديم',
          prefix: 'ak_live_old00000',
          status: 'revoked',
          lastUsedAt: '2026-10-02T08:30:00.000Z',
          revokedAt: '2026-10-02T09:00:00.000Z',
        }),
      ])
    )
    renderTab()

    const list = await screen.findByRole('list', { name: copy.listLabel })
    const [unused, revoked] = within(list).getAllByRole('listitem')
    const lastUsedLabel = copy.lastUsedAt.replace('{date}', '').trim()
    const revokedLabel = copy.revokedAt.replace('{date}', '').trim()

    expect(within(unused).getByText(copy.neverUsed)).toBeTruthy()
    expect(unused.textContent).not.toContain(lastUsedLabel)
    expect(unused.textContent).not.toContain(revokedLabel)
    expect(revoked.textContent).toContain(lastUsedLabel)
    expect(revoked.textContent).toContain(revokedLabel)
    expect(within(revoked).queryByText(copy.neverUsed)).toBeNull()
  })

  it('creates a key, shows it once, copies it and forgets it on close', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    api.post.mockResolvedValue({
      key: key({ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', name: 'API' }),
      secret: SECRET,
    })
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const dialog = await openCreateAndSubmit('  API  ')

    expect((await within(dialog).findByText(SECRET)).getAttribute('dir')).toBe(
      'ltr'
    )
    expect(api.post).toHaveBeenCalledWith('/api/integration-keys', {
      name: 'API',
    })
    expect(within(dialog).getByText(copy.reveal.once)).toBeTruthy()

    fireEvent.click(
      within(dialog).getByRole('button', { name: copy.reveal.copy })
    )
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(SECRET))
    expect(await within(dialog).findByText(copy.reveal.copied)).toBeTruthy()

    // The settled mutation does not keep the secret in the query cache.
    await waitFor(() =>
      expect(
        JSON.stringify(
          client
            .getMutationCache()
            .getAll()
            .map((m) => m.state.data)
        )
      ).not.toContain(SECRET)
    )

    fireEvent.click(
      within(dialog).getByRole('button', { name: copy.reveal.done })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.body.textContent).not.toContain(SECRET)

    // Reopening starts over at the name form.
    fireEvent.click(createButton())
    const reopened = await screen.findByRole('dialog')
    expect(
      (
        within(reopened).getByLabelText(
          copy.create.nameLabel
        ) as HTMLInputElement
      ).value
    ).toBe('')
    expect(document.body.textContent).not.toContain(SECRET)

    for (const [, value] of setItem.mock.calls)
      expect(String(value)).not.toContain(SECRET)
    // The list is refreshed after creating.
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
  })

  it('keeps the reveal open on Escape: only Done closes it', async () => {
    api.post.mockResolvedValue({ key: key(), secret: SECRET })
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const dialog = await openCreateAndSubmit('API')
    await within(dialog).findByText(SECRET)
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(SECRET)).toBeTruthy()
  })

  it('asks for a name before calling the API', async () => {
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const dialog = await openCreateAndSubmit('   ')

    expect(
      await within(dialog).findByText(copy.create.nameRequired)
    ).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([
    ['API_KEY_LIMIT_REACHED', 409],
    ['API_KEY_SETUP_INCOMPLETE', 409],
    ['API_KEY_ROLE_REQUIRED', 403],
  ] as const)('explains %s in Arabic', async (code, status) => {
    api.post.mockRejectedValue(new ApiError('refused', status, code))
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const dialog = await openCreateAndSubmit('API')

    expect(await within(dialog).findByText(copy.errors[code])).toBeTruthy()
  })

  it('explains an uncoded 429 in Arabic', async () => {
    api.post.mockRejectedValue(new ApiError('Too Many Requests', 429))
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const dialog = await openCreateAndSubmit('API')

    expect(
      await within(dialog).findByText(copy.errors.RATE_LIMITED)
    ).toBeTruthy()
  })

  it('has every key-management error in both locales', () => {
    const english = en.settings.standalone.page.apiKeys.errors
    expect(Object.keys(english).sort()).toEqual(Object.keys(copy.errors).sort())
    for (const text of [
      ...Object.values(english),
      ...Object.values(copy.errors),
    ])
      expect(text.trim()).not.toBe('')
  })

  it('disables creating at the active-key limit', async () => {
    api.get.mockResolvedValue(
      listOf(
        Array.from({ length: 2 }, (_, index) =>
          key({ id: `key-${index}`, prefix: `ak_live_abcd123${index}` })
        ),
        2
      )
    )
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    expect((createButton() as HTMLButtonElement).disabled).toBe(true)
    expect(
      screen.getByText(copy.limitReached.replace('{max}', '2'))
    ).toBeTruthy()
  })

  it('confirms before revoking, then refreshes the list', async () => {
    api.delete.mockResolvedValue(
      key({ status: 'revoked', revokedAt: '2026-10-02T12:00:00.000Z' })
    )
    renderTab()
    const list = await screen.findByRole('list', { name: copy.listLabel })

    fireEvent.click(within(list).getByRole('button', { name: /موقع المتجر/ }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        copy.revoke.title.replace('{name}', 'موقع المتجر')
      )
    ).toBeTruthy()
    expect(within(dialog).getByText(copy.revoke.description)).toBeTruthy()
    expect(api.delete).not.toHaveBeenCalled()

    fireEvent.click(
      within(dialog).getByRole('button', { name: copy.revoke.confirm })
    )

    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(
        '/api/integration-keys/cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      )
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
  })

  it('shows a viewer the keys without create or revoke', async () => {
    renderTab(true)
    const list = await screen.findByRole('list', { name: copy.listLabel })

    expect(screen.queryByRole('button', { name: copy.createButton })).toBeNull()
    expect(within(list).queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByText(copy.serverOnly)).toBeTruthy()
  })

  it('links to the server API guide in the reader’s language, in a new tab', async () => {
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const link = screen.getByRole('link', {
      name: new RegExp(copy.connect.guideLink),
    })
    expect(link.getAttribute('href')).toBe('/ar/docs/server-api')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noreferrer')
    expect(link.textContent).toContain(copy.connect.newTab)
  })

  it('shows where to send orders, left to right, and copies the address', async () => {
    renderTab()
    await screen.findByRole('list', { name: copy.listLabel })

    const address = screen.getByText(/\/api\/v1\/orders$/)
    expect(address.textContent).toMatch(/^https?:\/\/[^/]+\/api\/v1\/orders$/)
    expect(address.closest('[dir]')?.getAttribute('dir')).toBe('ltr')
    expect(screen.getByText(copy.connect.endpointLabel)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: copy.connect.copy }))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(address.textContent)
    )
    expect(await screen.findByText(copy.connect.copied)).toBeTruthy()
  })

  it('shows a viewer the guide link and the address', async () => {
    renderTab(true)
    await screen.findByRole('list', { name: copy.listLabel })

    expect(
      screen.getByRole('link', { name: new RegExp(copy.connect.guideLink) })
    ).toBeTruthy()
    expect(screen.getByText(/\/api\/v1\/orders$/)).toBeTruthy()
  })

  it('has the connection copy in both locales', () => {
    const english = en.settings.standalone.page.apiKeys.connect
    expect(Object.keys(english).sort()).toEqual(
      Object.keys(copy.connect).sort()
    )
    for (const text of [
      ...Object.values(english),
      ...Object.values(copy.connect),
    ])
      expect(text.trim()).not.toBe('')
  })

  it('shows an empty state', async () => {
    api.get.mockResolvedValue(listOf([]))
    renderTab()

    expect(await screen.findByText(copy.empty)).toBeTruthy()
  })
})
