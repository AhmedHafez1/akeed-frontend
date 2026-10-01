import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import TemplatesPage from './page'

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

function open(
  locale: string,
  searchParams: Record<string, string | string[] | undefined> = {}
) {
  return TemplatesPage({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(searchParams),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('/templates', () => {
  it.each(['ar', 'en'])(
    'redirects to the Message tab of Settings in %s',
    async (locale) => {
      await open(locale)
      expect(redirect).toHaveBeenCalledWith(`/${locale}/settings?tab=message`)
    }
  )

  it('keeps the other query params, including the embedded ones', async () => {
    await open('ar', {
      shop: 'demo.myshopify.com',
      host: 'abc',
      tag: ['a', 'b'],
      empty: undefined,
    })
    expect(redirect).toHaveBeenCalledWith(
      '/ar/settings?shop=demo.myshopify.com&host=abc&tag=a&tag=b&tab=message'
    )
  })

  it('replaces a tab param left over from the old page', async () => {
    await open('ar', { tab: 'templates' })
    expect(redirect).toHaveBeenCalledWith('/ar/settings?tab=message')
  })
})
