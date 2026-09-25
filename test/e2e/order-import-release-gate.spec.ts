import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/*
 * US-04.6-10 AC2, the browser half: arabic-excel.xlsx through the real
 * import modal (الملف → الفحص → الإرسال), the top bar's progress, and into
 * the Verifications list for the batch, in Arabic and English, light and
 * dark, at 1440 and 390 px. The fixture app answers with what the real
 * backend returned in akeed-backend's PostgreSQL end-to-end test, so the
 * screens show that run's data, and the UI's own requests are checked here.
 * Nothing reaches a provider: every answer is replayed.
 */

const ROOT = resolve(__dirname, '../..')
const REPLAY = join(ROOT, 'test/e01-smoke/app/[locale]/imports/replay')
const SHOTS = join(ROOT, 'output/playwright/order-imports/release-gate')

type Locale = 'ar' | 'en'
type Messages = Record<string, unknown>

const recording = JSON.parse(
  readFileSync(join(REPLAY, 'arabic-excel.recording.json'), 'utf8')
) as { batchId: string; steps: { step: string; body: unknown }[] }
const manifest = JSON.parse(
  readFileSync(join(REPLAY, 'arabic-excel.manifest.json'), 'utf8')
) as {
  mapping: Record<string, string | string[]>
  rows: { rowNumber: number; outcome: string }[]
  results: { status: Record<string, string> }
}
const messages: Record<Locale, Messages> = {
  ar: JSON.parse(readFileSync(join(ROOT, 'public/messages/ar.json'), 'utf8')),
  en: JSON.parse(readFileSync(join(ROOT, 'public/messages/en.json'), 'utf8')),
}

function message(locale: Locale, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)?.[part],
      messages[locale]
    )
  if (typeof value !== 'string') throw new Error(`No message ${key}`)
  return value
}

/** A message as a matcher: the literal text before its first ICU argument, anchored at the start. */
function label(locale: Locale, key: string): RegExp | string {
  const text = message(locale, key)
  const brace = text.indexOf('{')
  if (brace < 0) return text
  const literal = text.slice(0, brace).trim()
  return new RegExp('^' + literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
}

function recorded(step: string) {
  const found = recording.steps.find((entry) => entry.step === step)
  if (!found) throw new Error(`No recorded step ${step}`)
  return found.body as Record<string, unknown>
}

type ReplayCall = { method: string; url: string; body?: unknown }
async function replayCalls(page: Page): Promise<ReplayCall[]> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __akeedImportReplay?: { calls: ReplayCall[] }
        }
      ).__akeedImportReplay?.calls ?? []
  )
}

const posts = (calls: ReplayCall[], path: string) =>
  calls.filter((call) => call.method === 'POST' && call.url.endsWith(path))

async function prepare(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => {
    window.sessionStorage.setItem('akeed:e2e-replay', 'arabic-excel')
    window.sessionStorage.setItem('akeed:e2e-theme', value)
  }, theme)
}

/** Opens the modal on a fresh replay and uploads the real workbook. */
async function upload(page: Page, locale: Locale) {
  await page.goto(`/${locale}/imports/new`)
  await page.evaluate(() =>
    window.sessionStorage.removeItem('akeed:e2e-replay-stage')
  )
  await page
    .locator('input[type="file"]')
    .setInputFiles(join(REPLAY, 'arabic-excel.xlsx'))
  await page.waitForURL(new RegExp(`[?&]import=${recording.batchId}`))
}

const COMBINATIONS = (['ar', 'en'] as const).flatMap((locale) =>
  (['light', 'dark'] as const).flatMap((theme) =>
    ([1440, 390] as const).map((width) => ({ locale, theme, width }))
  )
)

mkdirSync(SHOTS, { recursive: true })

for (const { locale, theme, width } of COMBINATIONS) {
  test(`arabic-excel.xlsx file → check → import and send → progress → Verifications (${locale}, ${theme}, ${width})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await prepare(page, theme)
    const shot = (step: string) =>
      page.screenshot({
        path: join(SHOTS, `${locale}-${theme}-${width}-${step}.png`),
        fullPage: true,
      })
    const dialog = page.getByRole('dialog')

    await upload(page, locale)

    // Check: every column was detected; Continue sends that mapping unchanged.
    const next = dialog.getByRole('button', {
      name: message(locale, 'orderImport.check.footer.continue'),
    })
    await expect(next).toBeEnabled()
    await shot('1-check')
    await next.click()

    // Send: the ready orders priced before anything is imported, no consent
    // box, and nothing sent yet.
    const send = dialog.getByRole('button', {
      name: label(locale, 'orderImport.send.importAndSend'),
    })
    await expect(send).toBeEnabled()
    // Said once per layout: the footer line on desktop, under the buttons on phones.
    await expect(
      dialog
        .getByText(message(locale, 'orderImport.send.reassure'))
        .filter({ visible: true })
    ).toHaveCount(1)
    await expect(dialog.getByRole('checkbox')).toHaveCount(0)
    await shot('2-send')
    const beforeSend = await replayCalls(page)
    const mapping = beforeSend.find(
      (call) => call.method === 'PUT' && call.url.endsWith('/mapping')
    )
    expect(
      (mapping?.body as { mapping: Record<string, unknown> }).mapping
    ).toMatchObject(manifest.mapping)
    expect(posts(beforeSend, '/commit')).toEqual([])
    expect(posts(beforeSend, '/start')).toEqual([])

    // One press imports, then starts with the token of the quote shown.
    await send.click()
    await expect(
      page.getByText(label(locale, 'orderImport.send.done.sent'))
    ).toBeVisible({ timeout: 30_000 })
    await expect(dialog).toBeHidden()
    const afterSend = await replayCalls(page)
    expect(posts(afterSend, '/commit')).toHaveLength(1)
    const starts = posts(afterSend, '/start')
    expect(starts).toHaveLength(1)
    expect(starts[0].body).toEqual({
      quoteToken: recorded('start-quote').quoteToken,
    })
    await shot('3-sent')

    // The top bar follows the sends to their outcome, from the same counts
    // the list shows.
    const chip = page.getByRole('link', {
      name: label(locale, 'orderImport.progress.done'),
    })
    await expect(chip).toBeVisible({ timeout: 30_000 })
    await shot('4-progress')

    // It opens the existing Verifications list, filtered to the batch.
    await chip.click()
    await page.waitForURL(/\/verifications\?importBatchId=/)
    const results = recorded('verifications:results').data as {
      order_number: string
      status: string
    }[]
    for (const row of results)
      // The order number is printed with its leading #; at 390 px the cards
      // replace the (hidden) table.
      await expect(
        page
          .getByText(`#${row.order_number}`, { exact: true })
          .filter({ visible: true })
          .first()
      ).toBeVisible()
    await shot('5-verifications')

    // The list shows exactly the manifest's imported rows and outcomes.
    const byNumber = Object.fromEntries(
      results.map((row) => [row.order_number, row.status])
    )
    expect(byNumber).toEqual({
      '1001': manifest.results.status['2'],
      '1002': manifest.results.status['3'],
      '1003': manifest.results.status['4'],
      '1007': manifest.results.status['8'],
    })
    for (const status of new Set(Object.values(byNumber)))
      await expect(
        page
          .getByText(message(locale, `dashboard.verificationStatus.${status}`))
          .filter({ visible: true })
          .first()
      ).toBeVisible()
  })
}

test('resumes each step from the batch URL after a refresh', async ({
  page,
}) => {
  await prepare(page, 'light')
  const dialog = page.getByRole('dialog')
  const next = dialog.getByRole('button', {
    name: message('en', 'orderImport.check.footer.continue'),
  })
  const send = dialog.getByRole('button', {
    name: label('en', 'orderImport.send.importAndSend'),
  })

  await upload(page, 'en')
  await page.reload()
  await expect(next).toBeVisible()

  await next.click()
  await expect(send).toBeVisible()
  await page.reload()
  await expect(send).toBeVisible()

  // Import only: the orders are held, the modal closes, nothing is sent.
  await dialog
    .getByRole('button', { name: message('en', 'orderImport.send.importOnly') })
    .click()
  await expect(
    page.getByText(label('en', 'orderImport.send.done.imported'))
  ).toBeVisible({ timeout: 30_000 })
  expect(posts(await replayCalls(page), '/start')).toEqual([])

  // Opened again, the imported batch offers to send now.
  await page.goto(`/en/imports/${recording.batchId}`)
  const sendNow = page.getByRole('dialog').getByRole('button', {
    name: label('en', 'orderImport.send.sendNow'),
  })
  await expect(sendNow).toBeVisible()
  await expect(
    page.getByText(message('en', 'orderImport.send.importedNotice'))
  ).toBeVisible()
  await page.reload()
  await expect(sendNow).toBeVisible()
})
