import type { TipCardModel } from '@/features/tips'

let scenarioKey = ''
const dismissed = new Set<string>()
const viewed = new Map<string, string>()

/** Opt-in synthetic tips shared by the real dashboard and confirmations skins. */
export function tipsFixtureRequest<T>(method: 'GET' | 'POST', path: string): T {
  const query = new URLSearchParams(window.location.search)
  const selection = query.get('tips') ?? ''
  const key = `${selection}:${query.get('scenario') ?? ''}`
  if (scenarioKey !== key) {
    scenarioKey = key
    dismissed.clear()
    viewed.clear()
  }
  const url = new URL(path, 'http://fixture.local')
  if (method === 'GET') {
    const locale =
      selection === 'fallback' ? 'en' : url.searchParams.get('locale')
    const arabic = locale === 'ar'
    const card = (
      id: string,
      flagged: boolean,
      older = false
    ): TipCardModel => ({
      id,
      type: older ? 'tip' : 'update',
      locale: arabic ? 'ar' : 'en',
      title: older
        ? arabic
          ? 'اختر ساعات الهدوء المناسبة لمتجرك'
          : 'Choose quiet hours for your store'
        : selection === 'long'
          ? arabic
            ? 'دع عملاءك يؤكدون الطلب بلغتهم المفضلة لتسهيل تأكيد طلبات متجرك'
            : 'Let customers confirm in their preferred language across every order in your store'
          : arabic
            ? 'دع عملاءك يؤكدون الطلب بلغتهم'
            : 'Let customers confirm in their own language',
      description: arabic
        ? 'التفاصيل تظل في قائمة النصائح والتحديثات.'
        : 'The description stays in Tips & updates.',
      action: {
        kind: 'internal',
        route: 'settings_timing',
        label:
          selection === 'long'
            ? arabic
              ? 'افتح إعدادات تأكيد الطلبات'
              : 'Open confirmation settings'
            : arabic
              ? 'الإعدادات'
              : 'Settings',
      },
      show_as_banner: flagged,
      published_at: older ? '2026-11-01T10:00:00Z' : '2026-11-02T10:00:00Z',
      first_viewed_at: viewed.get(id) ?? null,
    })
    return {
      can_dismiss: query.get('scenario') !== 'viewer',
      cards:
        selection && selection !== 'none'
          ? [
              card('tip-new', true),
              card('tip-old', true, true),
              card('tip-card-only', false, true),
            ].filter((item) => !dismissed.has(item.id))
          : [],
    } as T
  }
  const match = /^\/api\/tips\/([^/]+)\/(view|click|dismiss)$/.exec(
    url.pathname
  )
  if (!match) throw new Error(`Unexpected synthetic tip request: ${path}`)
  const [, id, event] = match
  if (event === 'dismiss') {
    if (query.get('scenario') === 'viewer')
      throw new Error('Synthetic viewer cannot dismiss')
    dismissed.add(id)
  }
  if (event === 'view' && !viewed.has(id))
    viewed.set(id, new Date().toISOString())
  return { recorded: true } as T
}
