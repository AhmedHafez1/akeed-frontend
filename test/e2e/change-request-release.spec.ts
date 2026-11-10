import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function copy(locale: string) {
  return JSON.parse(
    readFileSync(resolve('public/messages', `${locale}.json`), 'utf8')
  ).dashboard.changeRequest as Record<string, string>
}

for (const locale of ['en', 'ar']) {
  for (const skin of ['standalone', 'embedded']) {
    for (const width of [390, 1440]) {
      test(`fixture: ${skin} ${locale} ${width} row opens Handle request directly`, async ({
        page,
      }) => {
        const t = copy(locale)
        await page.setViewportSize({ width, height: 1000 })
        const route =
          skin === 'standalone'
            ? 'standalone-confirmations?tab=change_requested'
            : 'embedded-dashboard?tab=confirmations&filter=change_requested'
        await page.goto(`/${locale}/${route}`)

        const trigger = page.getByRole('button', {
          name: `${t.handle}: #1131`,
          exact: true,
        })
        await expect(trigger).toBeVisible()
        await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0)
        await trigger.focus()
        await trigger.press('Enter')

        const dialog = page.getByRole('dialog')
        await expect(dialog).toHaveCount(1)
        await expect(
          dialog.getByRole('button', { name: t.confirmAfter, exact: true })
        ).toBeVisible()
        await expect(
          dialog.getByRole('link', { name: t.openWhatsapp, exact: true })
        ).toHaveAttribute('href', /wa\.me/)
        await expect(page.getByRole('menu')).toHaveCount(0)

        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(trigger).toBeVisible()
      })
    }
  }
}

test('integrated: production panel resolves a persisted request through the guarded API', async ({
  page,
  request,
}) => {
  test.skip(
    !process.env.CR05_BACKEND_URL,
    'Run the backend release-contract runner with -Browser'
  )
  const id = process.env.CR05_VERIFICATION_ID!
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `/en/standalone-confirmations?scenario=integrated&tab=change_requested&open=${id}`
  )
  const confirm = page.getByRole('button', {
    name: 'Confirmed after contacting customer',
    exact: true,
  })
  await expect(confirm).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Open WhatsApp', exact: true })
  ).toHaveAttribute('href', /wa\.me/)
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/change-request/confirm`) &&
      r.request().method() === 'POST'
  )
  await confirm.click()
  expect((await response).status()).toBe(200)
  await expect(confirm).toHaveCount(0)
  const saved = await request.get(
    `${process.env.CR05_BACKEND_URL}/api/verifications/${id}/change-request`,
    { headers: { Authorization: 'Bearer cr05-browser' } }
  )
  expect((await saved.json()).change_request).toMatchObject({
    status: 'resolved',
    resolution: 'merchant_confirmed',
  })
  expect(errors).toEqual([])
})

for (const locale of ['en', 'ar', 'ur', 'es', 'fr', 'tr']) {
  for (const skin of ['standalone', 'embedded']) {
    test(`fixture: ${skin} ${locale} contact and resolution controls`, async ({
      page,
    }, testInfo) => {
      const t = copy(locale)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      const mobile = ['ar', 'ur'].includes(locale)
      await page.setViewportSize({ width: mobile ? 390 : 1440, height: 1000 })
      const route =
        skin === 'standalone'
          ? 'standalone-confirmations?tab=change_requested'
          : 'embedded-dashboard?tab=confirmations&status=change_requested'
      await page.goto(`/${locale}/${route}&open=embedded-7`)
      await expect(
        page.getByRole('button', { name: t.confirmAfter, exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: t.openWhatsapp, exact: true })
      ).toHaveAttribute('href', /wa\.me/)
      const call = page.getByRole('link', { name: t.call, exact: true })
      await expect(call).toHaveAttribute('href', /^tel:/)
      if (skin === 'embedded') {
        await expect(call).toHaveAttribute('target', '_blank')
        await expect(call).toHaveAttribute('rel', 'noopener noreferrer')
      }
      await expect(
        page.getByRole('button', { name: t.copy, exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: t.panelTitle, exact: true })
      ).toBeVisible()
      await expect(
        page.getByText(t.emailUnavailable, { exact: true })
      ).toHaveCount(0)
      expect(await page.locator('html').getAttribute('dir')).toBe(
        mobile ? 'rtl' : 'ltr'
      )
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
      if (skin === 'standalone') {
        await page.evaluate(() =>
          document.documentElement.classList.add('dark')
        )
        await expect(
          page.getByRole('button', { name: t.confirmAfter, exact: true })
        ).toBeVisible()
      }
      await page.screenshot({
        path: testInfo.outputPath(`${skin}-${locale}.png`),
        fullPage: false,
      })
      expect(errors).toEqual([])
    })
  }
}

for (const scenario of ['empty', 'error', 'viewer', 'race']) {
  test(`fixture: standalone ${scenario} state`, async ({ page }) => {
    await page.goto(
      `/en/standalone-confirmations?scenario=${scenario}&tab=change_requested${['viewer', 'race'].includes(scenario) ? '&open=embedded-7' : ''}`
    )
    const confirm = page.getByRole('button', {
      name: 'Confirmed after contacting customer',
      exact: true,
    })
    if (scenario === 'viewer') {
      await expect(
        page.getByText(copy('en').panelTitle, { exact: true })
      ).toBeVisible()
      for (const name of [
        copy('en').confirmAfter,
        copy('en').cancelAfter,
        copy('en').resend,
      ])
        await expect(
          page.getByRole('button', { name, exact: true })
        ).toHaveCount(0)
    } else if (scenario === 'race') {
      await expect(confirm).toBeVisible()
      await confirm.click()
      await expect(confirm).toHaveCount(0)
    } else {
      await expect(
        page
          .getByText(
            scenario === 'empty'
              ? /No .*requests|No .*orders|No .*confirmations/i
              : /couldn.t|try again|error|failed/i
          )
          .first()
      ).toBeVisible()
      await expect(confirm).toHaveCount(0)
    }
  })
}

for (const ready of [true, false]) {
  test(`fixture: settings activation readiness ${ready}`, async ({ page }) => {
    await page.goto('/en/settings?tab=message' + (ready ? '' : '&cr=unready'))
    const toggle = page.getByRole('switch', {
      name: 'Let customers request a change',
      exact: true,
    })
    await expect(toggle).not.toBeChecked()
    if (ready) await expect(toggle).toBeEnabled()
    else {
      await expect(toggle).toBeDisabled()
      await expect(
        page.getByText('Not available yet. Try again later.', { exact: true })
      ).toBeVisible()
    }
  })
}

test('fixture: failed resend stays actionable and queued resend is not success', async ({
  page,
}) => {
  await page.goto(
    '/en/standalone-confirmations?tab=change_requested&open=embedded-8'
  )
  await expect(
    page.getByText('Customer not notified: no balance', { exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByText('Not sent: no balance', { exact: true })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Send updated confirmation', exact: true })
    .click()
  await expect(
    page.getByText('Sending…', { exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Send updated confirmation',
      exact: true,
    })
  ).toBeDisabled()
  await expect(
    page.getByText('Don’t ship this order yet', { exact: true })
  ).toBeVisible()
})

test('fixture: missing phone and quiet-hour wait remain explicit', async ({
  page,
}) => {
  await page.goto(
    '/en/standalone-confirmations?tab=change_requested&open=embedded-10'
  )
  await expect(
    page.getByText('No valid phone number', { exact: true })
  ).toBeVisible()
  for (const name of ['Open WhatsApp', 'Call', 'Copy number'])
    await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
  await expect(
    page.getByText(/Scheduled for .+quiet hours/).first()
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Send updated confirmation', exact: true })
  ).toBeDisabled()
})
