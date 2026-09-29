/*
 * Standalone dashboard first-run smoke run against the isolated fixture
 * (`npm run smoke:e01`, port 3098). Opens /ar/first-run in the first-run,
 * skipped-test and zero-balance scenarios plus the "send it to my phone"
 * dialog, at 1280px and 390px, asserts the essentials, and writes
 * screenshots to test/screenshots/standalone-first-run/.
 *
 *   node test/e01-smoke/first-run-check.mjs
 *
 * Uses the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH). Loopback only.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = 'http://127.0.0.1:3098'
const OUT = path.resolve('test/screenshots/standalone-first-run')
const WIDTHS = {
  1280: { width: 1280, height: 900 },
  390: { width: 390, height: 844 },
}

const COPY = {
  greeting: 'مرحبًا أحمد',
  card: 'أرسل أول تأكيد لعميل حقيقي',
  confirmOrder: 'تأكيد طلب',
  importFile: 'استيراد من ملف',
  skipped: 'لم تجرّب الرسالة بعد',
  sendToPhone: 'أرسلها إلى هاتفي',
  zero: 'رصيدك 0 رسالة',
  topUp: 'شحن الرصيد',
  balance: 'الرصيد 30 رسالة',
  dialog: 'رسالة تجريبية إلى هاتفك',
}

const results = []
function check(name, condition) {
  results.push({ name, ok: !!condition })
  if (!condition) console.error(`✗ ${name}`)
}

async function open(browser, width, scenario) {
  const context = await browser.newContext({
    viewport: WIDTHS[width],
    locale: 'ar-EG',
    timezoneId: 'Africa/Cairo',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  page.on('pageerror', (error) =>
    check(`no page error: ${error.message}`, false)
  )
  await page.goto(`${ORIGIN}/ar/first-run?scenario=${scenario}`)
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
  await page.getByRole('heading', { name: COPY.greeting }).waitFor()
  return { context, page }
}

async function shot(page, name) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
  return `${name}.png`
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  )
  check(`${label}: no horizontal scroll`, overflow <= 1)
}

const topBar = (page) => page.locator('header').first()

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const files = []

for (const width of [1280, 390]) {
  const prefix = `ar-${width}`

  // First run: the card owns the actions; the top bar only shows the balance.
  {
    const { context, page } = await open(browser, width, 'first-run')
    check(
      `${prefix} first-run card`,
      await page.getByRole('heading', { name: COPY.card }).isVisible()
    )
    check(
      `${prefix} top bar hides Import`,
      (await topBar(page).getByRole('link', { name: COPY.importFile }).count()) === 0
    )
    check(
      `${prefix} top bar hides Confirm order`,
      (await topBar(page).getByRole('button', { name: COPY.confirmOrder }).count()) === 0
    )
    check(
      `${prefix} balance chip`,
      (await topBar(page).getByRole('link', { name: COPY.balance }).count()) === 1
    )
    check(
      `${prefix} card has both ways in`,
      (await page.getByRole('main').getByRole('button', { name: COPY.confirmOrder }).count()) === 1 &&
        (await page.getByRole('main').getByRole('link', { name: COPY.importFile }).count()) === 1
    )
    await noHorizontalScroll(page, `${prefix} first-run`)
    files.push(await shot(page, `${prefix}-first-run`))
    await context.close()
  }

  // Skipped test: the reminder, then the free test dialog.
  {
    const { context, page } = await open(browser, width, 'skipped-test')
    check(
      `${prefix} skipped-test banner`,
      await page.getByText(COPY.skipped).isVisible()
    )
    await noHorizontalScroll(page, `${prefix} skipped-test`)
    files.push(await shot(page, `${prefix}-skipped-test`))

    await page.getByRole('button', { name: COPY.sendToPhone }).click()
    const dialog = page.getByRole('dialog', { name: COPY.dialog })
    await dialog.waitFor()
    await dialog.getByText('تم الإرسال').waitFor()
    check(
      `${prefix} dialog asks for no number`,
      (await dialog.locator('input').count()) === 0
    )
    await page.waitForTimeout(2500)
    files.push(await shot(page, `${prefix}-test-dialog`))
    await context.close()
  }

  // Zero balance: say so and link to billing instead of order actions.
  {
    const { context, page } = await open(browser, width, 'zero-balance')
    check(`${prefix} zero balance`, await page.getByText(COPY.zero).isVisible())
    check(
      `${prefix} top-up link`,
      (await page.getByRole('link', { name: COPY.topUp }).getAttribute('href')) ===
        '/ar/billing'
    )
    check(
      `${prefix} no order action at zero`,
      (await page.getByRole('main').getByRole('button', { name: COPY.confirmOrder }).count()) === 0
    )
    await noHorizontalScroll(page, `${prefix} zero-balance`)
    files.push(await shot(page, `${prefix}-zero-balance`))
    await context.close()
  }
}

await browser.close()

const failed = results.filter((result) => !result.ok)
console.log(`${results.length - failed.length}/${results.length} checks passed`)
console.log(files.map((file) => `  ${path.join(OUT, file)}`).join('\n'))
process.exit(failed.length ? 1 : 0)
