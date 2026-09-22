import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/*
 * US-04.6-10 AC2, the browser half: arabic-excel.xlsx through the real
 * wizard (upload → map → review → import → start → release) and into the
 * Verifications list for the batch, in Arabic and English, light and dark,
 * at 1440 and 390 px. The fixture app answers with what the real backend
 * returned in akeed-backend's PostgreSQL end-to-end test, so the screens
 * show that run's data, and the UI's own requests are checked here.
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

async function prepare(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => {
    window.sessionStorage.setItem('akeed:e2e-replay', 'arabic-excel')
    window.sessionStorage.setItem('akeed:e2e-theme', value)
  }, theme)
}

const COMBINATIONS = (['ar', 'en'] as const).flatMap((locale) =>
  (['light', 'dark'] as const).flatMap((theme) =>
    ([1440, 390] as const).map((width) => ({ locale, theme, width }))
  )
)

mkdirSync(SHOTS, { recursive: true })

for (const { locale, theme, width } of COMBINATIONS) {
  test(`arabic-excel.xlsx upload → map → review → import → start → release → Verifications (${locale}, ${theme}, ${width})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await prepare(page, theme)
    const shot = (step: string) =>
      page.screenshot({
        path: join(SHOTS, `${locale}-${theme}-${width}-${step}.png`),
        fullPage: true,
      })

    // Upload the real workbook the backend imported.
    await page.goto(`/${locale}/imports/new`)
    await page.evaluate(() =>
      window.sessionStorage.removeItem('akeed:e2e-replay-stage')
    )
    await page
      .locator('input[type="file"]')
      .setInputFiles(join(REPLAY, 'arabic-excel.xlsx'))
    await page.waitForURL(new RegExp(`/imports/${recording.batchId}`))

    // Map: every column was detected; Continue sends that mapping unchanged.
    await expect(
      page.getByRole('button', {
        name: label(locale, 'orderImport.map.continue'),
      })
    ).toBeVisible()
    await shot('1-map')
    await page
      .getByRole('button', { name: label(locale, 'orderImport.map.continue') })
      .click()

    // Review: the manifest's split, and nothing sent.
    await expect(
      page.getByText(message(locale, 'orderImport.nothingSent.banner'))
    ).toBeVisible()
    const importButton = page.getByRole('button', {
      name: label(locale, 'orderImport.review.import'),
    })
    await expect(importButton).toBeEnabled()
    await shot('2-review')
    const mapping = (await replayCalls(page)).find(
      (call) => call.method === 'PUT' && call.url.endsWith('/mapping')
    )
    expect(
      (mapping?.body as { mapping: Record<string, unknown> }).mapping
    ).toMatchObject(manifest.mapping)
    await importButton.click()

    // Imported and held: still nothing sent, and no start request yet.
    await expect(
      page.getByText(message(locale, 'orderImport.imported.nothingSent'))
    ).toBeVisible()
    await shot('3-imported')
    expect(
      (await replayCalls(page)).filter((call) => call.url.endsWith('/start'))
    ).toEqual([])

    // Start: the quote, the consent attestation, then the one start call.
    await page
      .getByRole('button', {
        name: label(locale, 'orderImport.imported.start'),
      })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('checkbox').check()
    await shot('4-start-dialog')
    await dialog
      .getByRole('button', { name: label(locale, 'orderImport.start.confirm') })
      .click()
    await expect(
      page
        .getByText(message(locale, 'orderImport.batchStatus.completed'))
        .first()
    ).toBeVisible({ timeout: 30_000 })
    await shot('5-completed')
    const starts = (await replayCalls(page)).filter(
      (call) => call.method === 'POST' && call.url.endsWith('/start')
    )
    expect(starts).toHaveLength(1)
    expect(starts[0].body).toMatchObject({
      attestationVersion: 'bulk-import-consent-v1',
    })

    // The results are the existing Verifications list, filtered to the batch.
    await page
      .getByRole('link', {
        name: message(locale, 'orderImport.imported.reviewOrders'),
      })
      .click()
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
    await shot('6-verifications')

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
  await page.goto('/en/imports/new')
  await page.evaluate(() =>
    window.sessionStorage.removeItem('akeed:e2e-replay-stage')
  )
  await page
    .locator('input[type="file"]')
    .setInputFiles(join(REPLAY, 'arabic-excel.xlsx'))
  await page.waitForURL(new RegExp(`/imports/${recording.batchId}`))
  await page.reload()
  await expect(
    page.getByRole('button', { name: label('en', 'orderImport.map.continue') })
  ).toBeVisible()

  await page
    .getByRole('button', { name: label('en', 'orderImport.map.continue') })
    .click()
  await expect(
    page.getByRole('button', { name: label('en', 'orderImport.review.import') })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: label('en', 'orderImport.review.import') })
  ).toBeVisible()

  await page
    .getByRole('button', { name: label('en', 'orderImport.review.import') })
    .click()
  await expect(
    page.getByText(message('en', 'orderImport.imported.nothingSent'))
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText(message('en', 'orderImport.imported.nothingSent'))
  ).toBeVisible()
})
