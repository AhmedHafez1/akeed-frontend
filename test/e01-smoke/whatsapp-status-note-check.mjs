/*
 * Renders the WhatsApp settings tab in every status against the isolated
 * fixture (`npm run smoke:e01`, port 3098), in English and Arabic, checks that
 * the note under the status rows says what the message file says, and saves a
 * screenshot of the card for each.
 *
 *   node test/e01-smoke/whatsapp-status-note-check.mjs
 *
 * SHOTS_DIR overrides the output folder. Loopback only, synthetic data.
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = 'http://127.0.0.1:3098'
const OUT = path.resolve(
  process.env.SHOTS_DIR ?? 'test/screenshots/whatsapp-status-note'
)
const PHONE = '+20 100 555 0101'
const ISOLATES = new RegExp(
  '[' + String.fromCharCode(0x2066) + String.fromCharCode(0x2069) + ']',
  'g'
)

const messages = {}
for (const locale of ['en', 'ar'])
  messages[locale] = JSON.parse(
    await readFile(`public/messages/${locale}.json`, 'utf8')
  ).whatsappConnect.tab

/** fixture scenario -> how the note should read */
const SCENARIOS = {
  unconnected: (m) => m.statusNote.notConnected,
  preparing: (m) => m.statusNote.settingUp,
  setupError: (m) => m.statusNote.sendingIssue.setup.replace('{number}', PHONE),
  verifyingRestricted: (m) => m.statusNote.awaitingTemplates,
  verifyingApproved: (m) =>
    `${m.statusNote.sendingIssue.restricted.replace('{number}', PHONE)} ${m.progress.issues.restricted}`,
  pending: (m) => m.statusNote.awaitingTemplates,
  mixed: (m) =>
    m.statusNote.awaitingTemplatesPartial
      .replace('{approved}', '1')
      .replace('{total}', '3')
      .replace('{number}', PHONE),
  active: (m) => m.statusNote.active.replace('{number}', PHONE),
  degraded: (m) => m.statusNote.sendingIssue.payment.replace('{number}', PHONE),
  credentials: (m) =>
    m.statusNote.sendingIssue.credentials.replace('{number}', PHONE),
  // No caption of its own: the sending row already says it is paused.
  sendingOff: (m) => m.progress.issues.sendingOff,
  templatesRejected: (m) =>
    m.statusNote.templatesRejected.replace('{number}', PHONE),
  disconnected: (m) => m.statusNote.disconnected,
}
const WIDTHS = {
  1280: { width: 1280, height: 900 },
  390: { width: 390, height: 844 },
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
let failed = 0
for (const [label, size] of Object.entries(WIDTHS)) {
  const context = await browser.newContext({ viewport: size })
  const page = await context.newPage()
  for (const locale of ['en', 'ar']) {
    for (const [scenario, expected] of Object.entries(SCENARIOS)) {
      const want = expected(messages[locale])
      await page.goto(
        `${ORIGIN}/${locale}/settings?tab=whatsapp&wa=${scenario}`,
        { waitUntil: 'domcontentloaded' }
      )
      // Match on the words before the number, which sits inside isolates.
      const note = page.locator('p', {
        hasText: want.split(PHONE)[0].trim().slice(0, 14),
      })
      let ok = false
      try {
        await note.first().waitFor({ timeout: 20000 })
        // Let the first render settle before reading the page.
        await page.waitForTimeout(600)
        const texts = await page
          .locator('p')
          .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ''))
        ok = texts.some((text) => text.replace(ISOLATES, '') === want)
      } catch {
        ok = false
      }
      const card = note.first().locator('xpath=ancestor::section[1]').first()
      const file = path.join(OUT, `${locale}-${label}-${scenario}.png`)
      try {
        await card.screenshot({ path: file })
      } catch {
        await page.screenshot({ path: file })
      }
      if (!ok) failed += 1
      console.log(`${ok ? 'PASS' : 'FAIL'} ${locale} ${label} ${scenario}`)
      if (!ok) console.log('   wanted:', want)
    }
  }
  await context.close()
}
await browser.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASSED', '->', OUT)
process.exit(failed ? 1 : 0)
