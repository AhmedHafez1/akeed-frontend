import { describe, expect, it } from 'vitest'
import ar from '../public/messages/ar.json'
import en from '../public/messages/en.json'
import es from '../public/messages/es.json'
import fr from '../public/messages/fr.json'
import tr from '../public/messages/tr.json'
import ur from '../public/messages/ur.json'

type Messages = { [key: string]: string | Messages }

/**
 * The admin screens exist in English only: Urdu, Spanish, French and Turkish
 * have no `admin*` strings.
 */
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
const french = merchantStrings(fr as Messages)
const turkish = merchantStrings(tr as Messages)

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
      'settings.embedded.message.languageNames.ur',
      'settings.embedded.tabs.plan',
      'settings.embedded.timing.customDelaySuffix',
      'settings.embedded.timing.minutesShort',
      'settings.sourceEasyOrders',
      'settings.sourceWooCommerce',
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

  it('writes Latin letters', () => {
    const wrongScript = Object.keys(spanish).filter((key) =>
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

describe('French messages', () => {
  const NO_BREAK = letter(0x00a0)
  const NARROW_NO_BREAK = letter(0x202f)
  /** What is left once addresses, arguments, clock times and codes are set aside. */
  const prose = (text: string) =>
    text
      .replace(/https?:\/\/\S*/g, '')
      .replace(/\{[^{}]*\}/g, 'X')
      .replace(/\d:\d|HH:mm|Akeed: [A-Za-z]+/g, '')

  it('has exactly the merchant-facing keys of the English file', () => {
    expect(Object.keys(french).sort()).toEqual(Object.keys(english).sort())
  })

  it('leaves the admin screens to English', () => {
    expect(Object.keys(fr).filter(isAdminNamespace)).toEqual([])
  })

  it('keeps every placeholder and tag of the English message', () => {
    const different = Object.keys(english).filter(
      (key) =>
        placeholders(french[key] ?? '').join(' ') !==
        placeholders(english[key]).join(' ')
    )
    expect(different).toEqual([])
  })

  it('translates every message that has words to translate', () => {
    // Left as written: names, codes, plan names, unit abbreviations and words
    // French spells the same way ("Total", "Message", "Confirmations").
    const untranslated = Object.keys(english).filter(
      (key) =>
        french[key] === english[key] &&
        /[a-z]{2}/.test(english[key].replace(/\{[^}]*\}/g, ''))
    )
    expect(untranslated.sort()).toEqual([
      'appHeader.notifications',
      'appHeader.verifications',
      'auth.shopifyStorePlaceholder',
      'auth.shopifyStoreSuffix',
      'auth.signup.source.options.easyorders.title',
      'auth.signup.source.options.woocommerce.title',
      'auth.signup.source.shopifyTitle',
      'billing.balance.unit',
      'billing.purchase.messages',
      'billing.purchase.total',
      'billing.purchase.unit',
      'billing.return.credits',
      'connectionLine.akeed',
      'dashboard.confirmations.headings.action',
      'dashboard.confirmations.headings.total',
      'dashboard.confirmations.resource.plural',
      'dashboard.confirmations.resource.singular',
      'dashboard.confirmations.title',
      'dashboard.firstRun.confirmations.title',
      'dashboard.headerTools.usage.allowance.generic',
      'dashboard.metrics.cards.total',
      'dashboard.sources.easyorders',
      'dashboard.sources.salla',
      'dashboard.sources.shopify',
      'dashboard.sources.woocommerce',
      'dashboard.sources.zid',
      'dashboard.standalone.settings.minutes',
      'dashboard.table.headings.actions',
      'dashboard.table.headings.total',
      'dashboard.table.testBadge',
      'dashboard.tabs.confirmations',
      'demo.bot_name_short',
      'docs.eyebrow',
      'easyOrdersConnect.eyebrow',
      'embeddedOnboarding.planBasicName',
      'embeddedOnboarding.planBusinessName',
      'embeddedOnboarding.planProName',
      'embeddedOnboarding.planStarterName',
      'footer.facebook',
      'footer.instagram',
      'footer.logoAlt',
      'footer.navigationTitle',
      'footer.youtube',
      'legal.privacySection5Title',
      'messageTemplate.variantLabels.direct',
      'messageTemplate.whatsappLabel',
      'onboarding.planBasicName',
      'onboarding.planBusinessName',
      'onboarding.planProName',
      'onboarding.planStarterName',
      'onboarding.test.phone.avatarAlt',
      'onboarding.test.phone.senderName',
      'onboarding.whatsapp',
      'orderImport.map.fields.notes',
      'orderImport.start.durationHours',
      'orderImport.start.durationMinutes',
      'orderImport.upload.templateExcel',
      'pricing_credits.total_label',
      'settings.automation.timezones.Asia_Muscat',
      'settings.automation.timezones.Asia_Qatar',
      'settings.automation.units.minute',
      'settings.automation.units.minutes',
      'settings.embedded.message.variantLabels.direct',
      'settings.embedded.message.variantLabels.standardPlain',
      'settings.embedded.tabs.message',
      'settings.embedded.timing.customDelaySuffix',
      'settings.embedded.timing.minutes',
      'settings.embedded.timing.minutesShort',
      'settings.sourceEasyOrders',
      'settings.sourceWooCommerce',
      'settings.standalone.page.apiKeys.status.active',
      'settings.standalone.page.store.health.webhooks.states.active',
      'settings.standalone.page.tabs.message',
      'sources.easyorders.title',
      'sources.shopify.title',
      'sources.woocommerce.title',
      'standaloneOnboarding.done.stats.balanceValue',
      'standaloneOnboarding.flow.menu',
      'standaloneOnboarding.store.timezones.Africa_Casablanca',
      'standaloneOnboarding.store.timezones.Asia_Amman',
      'standaloneOnboarding.store.timezones.Asia_Bahrain',
      'standaloneOnboarding.store.timezones.Asia_Qatar',
      'support.email',
      'tips.badge.note',
      'wooCommerceConnect.enterUrl.placeholder',
      'wooCommerceConnect.eyebrow',
      'wooCommerceConnect.webhooks.states.active',
    ])
  })

  it('writes Latin letters', () => {
    const wrongScript = Object.keys(french).filter((key) =>
      ARABIC_SCRIPT.test(french[key])
    )
    expect(wrongScript).toEqual([])
  })

  it('writes the typographic apostrophe, which ICU does not read as a quote', () => {
    // A straight apostrophe before a brace would quote the argument away.
    const straight = Object.keys(french).filter((key) =>
      /(?<!\})'(?!\{)/.test(french[key])
    )
    expect(straight).toEqual([])
  })

  it('puts a no-break space before high punctuation', () => {
    const narrow = new RegExp(`[^${NARROW_NO_BREAK}][;!?]`)
    const colon = new RegExp(`[^${NO_BREAK}]:`)
    const percent = new RegExp(`[^${NO_BREAK}]%`)
    const loose = Object.keys(french).filter((key) => {
      const text = prose(french[key])
      return narrow.test(text) || colon.test(text) || percent.test(text)
    })
    expect(loose).toEqual([])
  })

  it('quotes with spaced guillemets, not straight or curly quotes', () => {
    const quotes = new RegExp(
      `"|[${letter(0x201c, 0x201d)}]|${letter(0x00ab)}[^${NO_BREAK}]|[^${NO_BREAK}]${letter(0x00bb)}`
    )
    const wrong = Object.keys(french).filter((key) => quotes.test(french[key]))
    expect(wrong).toEqual([])
  })
})

describe('Turkish messages', () => {
  it('has exactly the merchant-facing keys of the English file', () => {
    expect(Object.keys(turkish).sort()).toEqual(Object.keys(english).sort())
  })

  it('leaves the admin screens to English', () => {
    expect(Object.keys(tr).filter(isAdminNamespace)).toEqual([])
  })

  it('keeps every placeholder and tag of the English message', () => {
    const different = Object.keys(english).filter(
      (key) =>
        placeholders(turkish[key] ?? '').join(' ') !==
        placeholders(english[key]).join(' ')
    )
    expect(different).toEqual([])
  })

  it('translates every message that has words to translate', () => {
    // Left as written: names, codes, plan names and words Turkish spells the
    // same way ("Plan", "Platform", "Test").
    const untranslated = Object.keys(english).filter(
      (key) =>
        turkish[key] === english[key] &&
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
      'dashboard.table.testBadge',
      'demo.bot_name_short',
      'easyOrdersConnect.eyebrow',
      'embeddedOnboarding.planBasicName',
      'embeddedOnboarding.planBusinessName',
      'embeddedOnboarding.planProName',
      'embeddedOnboarding.planStarterName',
      'footer.facebook',
      'footer.instagram',
      'footer.logoAlt',
      'footer.youtube',
      'messageTemplate.whatsappLabel',
      'onboarding.flow.plan',
      'onboarding.planBasicName',
      'onboarding.planBusinessName',
      'onboarding.planProName',
      'onboarding.planStarterName',
      'onboarding.platform',
      'onboarding.test.phone.avatarAlt',
      'onboarding.test.phone.senderName',
      'onboarding.whatsapp',
      'orderImport.upload.templateExcel',
      'settings.embedded.tabs.plan',
      'settings.sourceEasyOrders',
      'settings.sourceWooCommerce',
      'sources.easyorders.title',
      'sources.shopify.title',
      'sources.woocommerce.title',
      'standaloneOnboarding.store.timezones.Asia_Amman',
      'standaloneOnboarding.store.timezones.Asia_Bahrain',
      'standaloneOnboarding.store.timezones.Asia_Dubai',
      'standaloneOnboarding.store.timezones.Asia_Qatar',
      'support.email',
      'wooCommerceConnect.eyebrow',
    ])
  })

  it('writes Latin letters, with the Turkish ones', () => {
    const wrongScript = Object.keys(turkish).filter((key) =>
      ARABIC_SCRIPT.test(turkish[key])
    )
    expect(wrongScript).toEqual([])
    const all = Object.values(turkish).join(' ')
    // ğ, ı, İ and ş: the letters a text typed without Turkish support loses.
    for (const code of [0x011f, 0x0131, 0x0130, 0x015f]) {
      expect(all).toContain(letter(code))
    }
  })

  it('writes every apostrophe as the typographic one', () => {
    // A suffix on a name ("Shopify’da") takes an apostrophe; a straight one
    // before a brace would open an ICU quote and drop the value.
    const straight = Object.keys(turkish).filter((key) =>
      turkish[key].includes("'")
    )
    expect(straight).toEqual([])
  })

  it('puts no suffix on a placeholder, whose vowels it cannot know', () => {
    const suffixed = Object.keys(turkish).filter((key) =>
      /\}\s?['’]/.test(turkish[key])
    )
    expect(suffixed).toEqual([])
  })
})

describe('Arabic and English messages', () => {
  it('label the embedded language menu in every language', () => {
    for (const messages of [ar, en, ur, es, fr, tr]) {
      expect(messages.embeddedSupport.localeLabel).toEqual(expect.any(String))
      expect(messages.settings.languageSwitching).toEqual(expect.any(String))
    }
  })
})
