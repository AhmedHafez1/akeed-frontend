/*
 * Standalone onboarding v2 smoke run against the isolated fixture
 * (`npm run smoke:e01`, port 3098). Drives /ar and /en through
 * store → test → done plus the backend=unavailable, role=viewer and
 * loading variants at 1280px and 390px, asserts the essentials, and writes
 * screenshots to test/screenshots/standalone-onboarding-v2/.
 *
 *   node test/e01-smoke/onboarding-v2-check.mjs
 *
 * Start the fixture with NEXT_PUBLIC_AKEED_WHATSAPP_NUMBER set (any digits)
 * to also cover the phone-only "Open WhatsApp" button.
 *
 * Uses the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH). Loopback only.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = 'http://127.0.0.1:3098'
const OUT = path.resolve('test/screenshots/standalone-onboarding-v2')
const WIDTHS = {
  1280: { width: 1280, height: 900 },
  390: { width: 390, height: 844 },
}

const COPY = {
  ar: {
    store: 'جهّز رسالة التأكيد لمتجرك',
    test: 'شاهد ما سيراه عميلك',
    done: 'وصل تأكيدك. هكذا يعمل أكيد مع كل طلب',
    submit: 'التالي: أرسل رسالة تجريبية',
    nameLabel: 'اسم المتجر كما يظهر في الرسالة',
    nameError: 'اكتب اسم متجرك كما يعرفه عملاؤك.',
    phoneError: 'الرقم ناقص.',
    unavailable: 'لم نتمكن من الوصول إلى واتساب الآن',
    continue: 'المتابعة إلى لوحة التحكم',
    loading: 'نجهّز بيانات متجرك…',
    readOnly: 'لديك صلاحية عرض فقط',
    tap: 'اضغط «تأكيد الطلب» على هاتفك',
    compactStore: '2 من 3 · متجرك',
  },
  en: {
    store: 'Get your confirmation message ready',
    test: 'See what your customer will see',
    done: 'Your confirmation arrived. This is how Akeed works with every order',
    submit: 'Next: send a test message',
    nameLabel: 'Store name as it appears in the message',
    nameError: 'Enter your store name the way your customers know it.',
    phoneError: 'The number is incomplete.',
    unavailable: "We can't reach WhatsApp right now",
    continue: 'Continue to dashboard',
    loading: 'Getting your store ready…',
    tap: 'Tap "Confirm order" on your phone',
    compactStore: '2 of 3 · Your store',
    readOnly: 'You have read-only access',
  },
}

const results = []
function check(name, condition) {
  results.push({ name, ok: !!condition })
  if (!condition) console.error(`✗ ${name}`)
}

async function open(browser, locale, width, query = '') {
  const context = await browser.newContext({
    viewport: WIDTHS[width],
    locale: `${locale}-EG`,
    timezoneId: 'Africa/Cairo',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  page.on('pageerror', (error) =>
    check(`no page error: ${error.message}`, false)
  )
  await page.goto(`${ORIGIN}/${locale}/onboarding${query}`)
  // Fixture controls and the Next dev indicator are not part of the product.
  await page.addStyleTag({
    content: '[data-fixture-controls],nextjs-portal{display:none!important}',
  })
  return { context, page }
}

async function shot(page, name) {
  await page.waitForTimeout(250)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
  return `${name}.png`
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  )
  check(`${label}: no horizontal scroll (${overflow}px)`, overflow <= 0)
}

async function fillPhone(page, digits) {
  const phone = page.locator('#onboarding-whatsapp-phone')
  await phone.click()
  await phone.press('End')
  await phone.pressSequentially(digits)
}

async function runHappyPath(browser, locale, width) {
  const t = COPY[locale]
  const tag = `${locale}-${width}`
  const { context, page } = await open(browser, locale, width, '?role=owner')
  await page.getByRole('heading', { name: t.store }).waitFor()
  await page.getByLabel(t.nameLabel).waitFor()
  await page.waitForFunction(
    () => new URL(location.href).searchParams.get('step') === 'store'
  )
  check(
    `${tag}: dir`,
    (await page.evaluate(() => document.documentElement.dir)) ===
      (locale === 'ar' ? 'rtl' : 'ltr')
  )
  check(
    `${tag}: URL step=store`,
    new URL(page.url()).searchParams.get('step') === 'store'
  )
  check(
    `${tag}: store name prefilled`,
    (await page.getByLabel(t.nameLabel).inputValue()) === 'متجر نور'
  )
  if (width === 390) {
    check(
      `${tag}: compact progress`,
      await page.getByText(t.compactStore).isVisible()
    )
  } else {
    check(
      `${tag}: stepper current step`,
      (await page.locator('nav li[aria-current="step"]').count()) === 1
    )
    await page
      .getByText(/250\.00/)
      .first()
      .waitFor()
  }
  await noHorizontalScroll(page, `${tag} store`)
  await shot(page, `${tag}-store`)

  // Invalid: blank name and a short number, focus lands on the name.
  await page.getByLabel(t.nameLabel).fill('')
  await fillPhone(page, '101234')
  await page.getByRole('button', { name: t.submit }).click()
  await page.getByText(t.nameError).waitFor()
  check(
    `${tag}: phone error`,
    await page.getByText(t.phoneError, { exact: false }).isVisible()
  )
  check(
    `${tag}: focus on first invalid field`,
    await page.evaluate(
      () => document.activeElement?.id === 'onboarding-store-name'
    )
  )
  await shot(page, `${tag}-store-invalid`)

  // Valid submit → test.
  await page.getByLabel(t.nameLabel).fill('متجر نور')
  await fillPhone(page, '5670')
  await page.getByRole('button', { name: t.submit }).click()
  await page.getByRole('heading', { name: t.test }).waitFor()
  check(
    `${tag}: URL step=test`,
    new URL(page.url()).searchParams.get('step') === 'test'
  )
  await page
    .getByText(locale === 'ar' ? 'وصلت إلى هاتفك' : 'Arrived on your phone')
    .waitFor({ timeout: 10000 })
  if (width === 390 && process.env.NEXT_PUBLIC_AKEED_WHATSAPP_NUMBER) {
    const openWhatsApp = page.getByRole('link', {
      name: locale === 'ar' ? 'افتح واتساب' : 'Open WhatsApp',
    })
    check(`${tag}: Open WhatsApp on phones`, await openWhatsApp.isVisible())
    check(
      `${tag}: Open WhatsApp deep link`,
      (await openWhatsApp.getAttribute('href'))?.startsWith('https://wa.me/')
    )
  }
  await noHorizontalScroll(page, `${tag} test`)
  await shot(page, `${tag}-test`)

  // Back returns to store with values kept; Forward returns to test.
  await page.goBack()
  await page.getByRole('heading', { name: t.store }).waitFor()
  check(
    `${tag}: Back keeps the name`,
    (await page.getByLabel(t.nameLabel).inputValue()) === 'متجر نور'
  )
  await page.goForward()
  await page.getByRole('heading', { name: t.test }).waitFor()

  // The merchant taps Confirm on the phone → done in place.
  await page.evaluate(() =>
    document.querySelector('[data-fixture-controls] button')?.click()
  )
  await page.getByRole('heading', { name: t.done }).waitFor({ timeout: 10000 })
  check(
    `${tag}: URL step=done`,
    new URL(page.url()).searchParams.get('step') === 'done'
  )
  check(
    `${tag}: stayed on /onboarding`,
    new URL(page.url()).pathname === `/${locale}/onboarding`
  )
  await noHorizontalScroll(page, `${tag} done`)
  await shot(page, `${tag}-done`)
  await context.close()
}

async function runUnavailable(browser, locale, width) {
  const t = COPY[locale]
  const tag = `${locale}-${width}`
  const { context, page } = await open(
    browser,
    locale,
    width,
    '?backend=unavailable'
  )
  await page.getByRole('heading', { name: t.store }).waitFor()
  await fillPhone(page, '1012345670')
  await page.getByRole('button', { name: t.submit }).click()
  await page.getByText(t.unavailable).waitFor()
  await noHorizontalScroll(page, `${tag} unavailable`)
  await shot(page, `${tag}-test-unavailable`)
  await page.getByRole('button', { name: t.continue }).click()
  await page.waitForURL(`**/${locale}/dashboard`, { timeout: 15000 })
  check(`${tag}: unavailable → dashboard after /complete`, true)
  await context.close()
}

async function runViewer(browser, locale, width) {
  const t = COPY[locale]
  const tag = `${locale}-${width}`
  const { context, page } = await open(browser, locale, width, '?role=viewer')
  await page.getByText(t.readOnly, { exact: false }).waitFor()
  check(
    `${tag}: viewer has no primary`,
    (await page.getByRole('button', { name: t.submit }).count()) === 0
  )
  await shot(page, `${tag}-viewer`)
  await context.close()
}

async function runLoading(browser, locale, width) {
  const t = COPY[locale]
  const tag = `${locale}-${width}`
  const { context, page } = await open(browser, locale, width, '?slow=state')
  await page.getByText(t.loading).waitFor()
  check(
    `${tag}: loading primary disabled`,
    await page.getByRole('button', { name: t.submit }).isDisabled()
  )
  await shot(page, `${tag}-store-loading`)
  await context.close()
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
})
try {
  for (const locale of ['ar', 'en']) {
    for (const width of [1280, 390]) {
      await runHappyPath(browser, locale, width)
      await runUnavailable(browser, locale, width)
      await runViewer(browser, locale, width)
      await runLoading(browser, locale, width)
    }
  }
} finally {
  await browser.close()
}

const failed = results.filter((result) => !result.ok)
console.log(`${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
