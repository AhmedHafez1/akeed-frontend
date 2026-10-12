import { describe, expect, it } from 'vitest'
import ar from '../public/messages/ar.json'
import en from '../public/messages/en.json'
import es from '../public/messages/es.json'
import ur from '../public/messages/ur.json'

type Messages = { [key: string]: string | Messages }

/** The admin screens exist in English only: Urdu and Spanish have no `admin*` strings. */
const isAdminNamespace = (key: string) => key.startsWith('admin')

function flatten(
  node: Messages,
  prefix = '',
  out: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out[path] = value
    else flatten(value, path, out)
  }
  return out
}

function merchantStrings(messages: Messages) {
  return flatten(
    Object.fromEntries(
      Object.entries(messages).filter(([key]) => !isAdminNamespace(key))
    )
  )
}

/** The ICU arguments and rich-text tags a message uses, in a fixed order. */
function placeholders(text: string): string[] {
  const names = new Set<string>()
  const stack: boolean[] = []
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '}') stack.pop()
    if (char !== '{') continue
    // Inside a plural or select, a brace opens a branch body, not an argument.
    if (stack[stack.length - 1]) {
      stack.push(false)
      continue
    }
    const argument = /^\{\s*([A-Za-z_]\w*)\s*(?:,\s*(\w+))?/.exec(
      text.slice(index)
    )
    if (argument) names.add(`{${argument[1]}}`)
    stack.push(
      Boolean(
        argument?.[2] && /^(plural|select|selectordinal)$/.test(argument[2])
      )
    )
  }
  for (const tag of text.match(/<\/?[A-Za-z]\w*\s*\/?>/g) ?? []) names.add(tag)
  return [...names].sort()
}

const letter = (...codes: number[]) => String.fromCharCode(...codes)
const URDU_SCRIPT = new RegExp(`[${letter(0x0600)}-${letter(0x06ff)}]`)
/** Arabic yeh, alef maksura, kaf and heh, which Urdu writes with other letters. */
const ARABIC_ONLY_LETTERS = new RegExp(
  `[${letter(0x064a, 0x0649, 0x0643, 0x0647)}]`
)

const english = merchantStrings(en)
const urdu = merchantStrings(ur as Messages)
const spanish = merchantStrings(es as Messages)

const ARABIC_SCRIPT = URDU_SCRIPT
/** Spanish opens a question or an exclamation with the inverted mark. */
const count = (text: string, mark: number) =>
  text.split(letter(mark)).length - 1

describe('Urdu messages', () => {
  it('has exactly the merchant-facing keys of the English file', () => {
    expect(Object.keys(urdu).sort()).toEqual(Object.keys(english).sort())
  })

  it('leaves the admin screens to English', () => {
    expect(Object.keys(ur).filter(isAdminNamespace)).toEqual([])
  })

  it('keeps every placeholder and tag of the English message', () => {
    const different = Object.keys(english).filter(
      (key) =>
        placeholders(urdu[key] ?? '').join(' ') !==
        placeholders(english[key]).join(' ')
    )
    expect(different).toEqual([])
  })

  it('translates every message that has words to translate', () => {
    // Left as written: names, codes, numbers, addresses and bare placeholders.
    const untranslated = Object.keys(english).filter(
      (key) =>
        urdu[key] === english[key] &&
        /[a-z]{2}/.test(english[key].replace(/\{[^}]*\}/g, ''))
    )
    expect(untranslated.sort()).toEqual([
      'auth.shopifyStorePlaceholder',
      'auth.shopifyStoreSuffix',
      'auth.signup.source.options.easyorders.title',
      'auth.signup.source.options.woocommerce.title',
      'auth.signup.source.shopifyTitle',
      'connectionLine.akeed',
      'dashboard.sources.easyorders',
      'dashboard.sources.salla',
      'dashboard.sources.shopify',
      'dashboard.sources.woocommerce',
      'dashboard.sources.zid',
      'demo.bot_name_short',
      'easyOrdersConnect.eyebrow',
      'footer.logoAlt',
      'onboarding.test.phone.avatarAlt',
      'onboarding.test.phone.senderName',
      'orderImport.upload.templateExcel',
      'settings.sourceEasyOrders',
      'settings.sourceWooCommerce',
      'settings.switchToEnglish',
      'sources.easyorders.title',
      'sources.shopify.title',
      'sources.woocommerce.title',
      'support.email',
      'wooCommerceConnect.enterUrl.placeholder',
      'wooCommerceConnect.eyebrow',
    ])
  })

  it('writes translated text in Urdu letters, not Arabic letter forms', () => {
    const wrongScript = Object.keys(urdu).filter(
      (key) =>
        urdu[key] !== english[key] &&
        // The Arabic language is named in Arabic in every language menu.
        key !== 'settings.switchToArabic' &&
        (!URDU_SCRIPT.test(urdu[key]) || ARABIC_ONLY_LETTERS.test(urdu[key]))
    )
    expect(wrongScript).toEqual([])
  })
})

describe('Spanish messages', () => {
  it('has exactly the merchant-facing keys of the English file', () => {
    expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort())
  })

  it('leaves the admin screens to English', () => {
    expect(Object.keys(es).filter(isAdminNamespace)).toEqual([])
  })

  it('keeps every placeholder and tag of the English message', () => {
    const different = Object.keys(english).filter(
      (key) =>
        placeholders(spanish[key] ?? '').join(' ') !==
        placeholders(english[key]).join(' ')
    )
    expect(different).toEqual([])
  })

  it('translates every message that has words to translate', () => {
    // Left as written: names, codes, plan names, unit abbreviations and words
    // Spanish spells the same way ("Total", "Legal", "Plan").
    const untranslated = Object.keys(english).filter(
      (key) =>
        spanish[key] === english[key] &&
        /[a-z]{2}/.test(english[key].replace(/\{[^}]*\}/g, ''))
    )
    expect(untranslated.sort()).toEqual([
      'auth.shopifyStorePlaceholder',
      'auth.shopifyStoreSuffix',
      'auth.signup.source.options.easyorders.title',
      'auth.signup.source.options.woocommerce.title',
      'auth.signup.source.shopifyTitle',
      'billing.purchase.total',
      'connectionLine.akeed',
      'dashboard.confirmations.headings.total',
      'dashboard.metrics.cards.total',
      'dashboard.sources.easyorders',
      'dashboard.sources.salla',
      'dashboard.sources.shopify',
      'dashboard.sources.woocommerce',
      'dashboard.sources.zid',
      'dashboard.standalone.settings.minutes',
      'dashboard.table.headings.total',
      'demo.bot_name_short',
      'easyOrdersConnect.eyebrow',
      'embeddedOnboarding.planBasicName',
      'embeddedOnboarding.planBusinessName',
      'embeddedOnboarding.planProName',
      'embeddedOnboarding.planStarterName',
      'footer.facebook',
      'footer.instagram',
      'footer.legalTitle',
      'footer.logoAlt',
      'footer.youtube',
      'legal.refundEyebrow',
      'legal.termsEyebrow',
      'messageTemplate.phoneTotalLabel',
      'messageTemplate.whatsappLabel',
      'onboarding.flow.plan',
      'onboarding.planBasicName',
      'onboarding.planBusinessName',
      'onboarding.planProName',
      'onboarding.planStarterName',
      'onboarding.test.phone.avatarAlt',
      'onboarding.test.phone.senderName',
      'onboarding.whatsapp',
      'orderImport.start.durationHours',
      'orderImport.start.durationMinutes',
      'orderImport.upload.templateExcel',
      'pricing_credits.total_label',
      'settings.automation.timezones.Asia_Kuwait',
      'settings.embedded.tabs.plan',
      'settings.embedded.timing.customDelaySuffix',
      'settings.sourceEasyOrders',
      'settings.sourceWooCommerce',
      'settings.switchToEnglish',
      'sources.easyorders.title',
      'sources.shopify.title',
      'sources.woocommerce.title',
      'standaloneOnboarding.store.timezones.Africa_Casablanca',
      'standaloneOnboarding.store.timezones.Asia_Bahrain',
      'standaloneOnboarding.store.timezones.Asia_Qatar',
      'support.email',
      'wooCommerceConnect.enterUrl.placeholder',
      'wooCommerceConnect.eyebrow',
    ])
  })

  it("writes Latin letters, except the other languages' own names", () => {
    const wrongScript = Object.keys(spanish).filter(
      (key) =>
        key !== 'settings.switchToArabic' &&
        key !== 'settings.switchToUrdu' &&
        ARABIC_SCRIPT.test(spanish[key])
    )
    expect(wrongScript).toEqual([])
  })

  it('opens every question and exclamation with its inverted mark', () => {
    const unbalanced = Object.keys(spanish).filter(
      (key) =>
        count(spanish[key], 0x3f) !== count(spanish[key], 0xbf) ||
        count(spanish[key], 0x21) !== count(spanish[key], 0xa1)
    )
    expect(unbalanced).toEqual([])
  })
})

describe('Arabic and English messages', () => {
  it('name every interface language in the embedded title bar', () => {
    for (const messages of [ar, en, ur, es])
      expect(messages.settings).toMatchObject({
        switchToArabic: expect.any(String),
        switchToEnglish: expect.any(String),
        switchToUrdu: expect.any(String),
        switchToSpanish: expect.any(String),
      })
  })
})
