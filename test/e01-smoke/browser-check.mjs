const labelsByLocale = {
  en: {
    cancel: 'Cancel order',
    keep: 'Keep order',
    confirm: 'Yes, cancel',
    loading: 'Canceling...',
    error: 'We could not cancel this order. Please try again.',
  },
  ar: {
    cancel: 'إلغاء الطلب',
    keep: 'إبقاء الطلب',
    confirm: 'نعم، ألغِ الطلب',
    loading: 'جارٍ الإلغاء...',
    error: 'تعذر إلغاء هذا الطلب. حاول مرة أخرى.',
  },
}

export async function checkCancellation(tab, skin, locale) {
  if (new URL(await tab.url()).origin !== 'http://127.0.0.1:3098') {
    throw new Error(
      'Cancellation checks are restricted to the isolated loopback fixture'
    )
  }
  const page = tab.playwright
  const labels = labelsByLocale[locale]
  const button = (name) => page.getByRole('button', { name, exact: true })
  const ensure = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const counts = async () => {
    await button('Inspect fixture calls').click()
    return JSON.parse(
      await page
        .getByRole('status', { name: 'Fixture calls', exact: true })
        .innerText({})
    )
  }
  await button(labels.cancel).waitFor({ state: 'visible', timeoutMs: 10000 })
  await page
    .getByRole('combobox', { name: 'Fixture skin', exact: true })
    .selectOption(skin, {})
  await button(labels.cancel).waitFor({ state: 'visible', timeoutMs: 10000 })
  const baseline = await counts()
  await button(labels.cancel).click()
  await button(labels.keep).click()
  ensure(
    (await counts()).cancellations === 0,
    'Dismissal submitted a cancellation'
  )
  await button(labels.cancel).click()
  await button(labels.confirm).click()
  await button(labels.loading).waitFor({ state: 'visible', timeoutMs: 10000 })
  ensure(
    !(await button(labels.loading).isEnabled()) &&
      !(await button(labels.keep).isEnabled()),
    'Pending actions remained enabled'
  )
  const held = await counts()
  ensure(held.cancellations === 1 && held.pending, 'Expected one held request')
  await button('Resolve pending fixture request').click()
  await page
    .getByText(labels.error, { exact: true })
    .waitFor({ state: 'visible', timeoutMs: 10000 })
  const rejected = await counts()
  ensure(
    rejected.lists === baseline.lists && rejected.stats === baseline.stats,
    'Rejection unexpectedly refreshed'
  )
  await page
    .getByRole('combobox', { name: 'Fixture result', exact: true })
    .selectOption('success', {})
  await button(labels.confirm).click()
  await button(labels.loading).waitFor({ state: 'visible', timeoutMs: 10000 })
  await button('Resolve pending fixture request').click()
  await button(labels.confirm).waitFor({ state: 'hidden', timeoutMs: 10000 })
  const complete = await counts()
  ensure(
    complete.cancellations === 2 && complete.lists > baseline.lists,
    'Success did not refresh the row'
  )
  ensure(
    skin === 'embedded'
      ? complete.stats === 0
      : complete.stats > baseline.stats,
    'Unexpected statistics refresh behavior'
  )
  ensure(
    (await button(labels.cancel).count()) === 0,
    'Canceled row still exposes cancellation'
  )
  return { skin, locale, baseline, held, rejected, complete, passed: true }
}

export async function checkStandaloneOnboarding(tab, locale) {
  if (new URL(await tab.url()).origin !== 'http://127.0.0.1:3098') {
    throw new Error('Onboarding checks are restricted to the loopback fixture')
  }
  const page = tab.playwright
  const labels =
    locale === 'ar'
      ? {
          name: 'اسم التاجر',
          save: 'حفظ التقدم',
          saved: 'تم حفظ تقدم الإعداد.',
          complete: 'إكمال الإعداد',
        }
      : {
          name: 'Merchant name',
          save: 'Save progress',
          saved: 'Setup progress saved.',
          complete: 'Complete setup',
        }
  await page.getByLabel(labels.name).fill('Synthetic merchant')
  await page.getByRole('button', { name: labels.save }).click()
  await page.getByText(labels.saved, { exact: true }).waitFor({
    state: 'visible',
    timeoutMs: 10000,
  })
  await page.getByRole('button', { name: labels.complete }).click()
  await page.getByRole('status').waitFor({ state: 'visible', timeoutMs: 10000 })
  return { locale, passed: true }
}

const manualOrderLabelsByLocale = {
  en: {
    open: 'New order',
    close: 'Close',
    phone: 'Customer phone Required',
    phoneRequired: "Enter the customer's phone number.",
    amount: 'Order amount Required',
    submit: 'Create order',
    submitting: 'Creating order...',
    accepted: 'Accepted · Processing pending',
    orderId: 'manual-order-fixture-order-id',
    createAnother: 'Create another order',
    network:
      'We could not confirm whether the order was accepted. Keep these details unchanged and retry with the same token.',
    retry: 'Retry safely',
  },
  ar: {
    open: 'طلب جديد',
    close: 'إغلاق',
    phone: 'هاتف العميل مطلوب',
    phoneRequired: 'أدخل رقم هاتف العميل.',
    amount: 'قيمة الطلب مطلوب',
    submit: 'إنشاء الطلب',
    submitting: 'جارٍ إنشاء الطلب...',
    accepted: 'مقبول · المعالجة قيد الانتظار',
    orderId: 'manual-order-fixture-order-id',
    createAnother: 'إنشاء طلب آخر',
    network:
      'تعذر تأكيد قبول الطلب. أبقِ هذه البيانات كما هي وأعد المحاولة بالرمز نفسه.',
    retry: 'إعادة المحاولة بأمان',
  },
}

export async function checkManualOrder(tab, locale) {
  const url = new URL(await tab.url())
  if (
    url.origin !== 'http://127.0.0.1:3098' ||
    !url.pathname.endsWith('/manual-order')
  ) {
    throw new Error(
      'Manual-order checks are restricted to the isolated loopback fixture'
    )
  }

  const page = tab.playwright
  const labels = manualOrderLabelsByLocale[locale]
  const button = (name) => page.getByRole('button', { name, exact: true })
  const inspect = async (force = false) => {
    await page
      .locator('button')
      .filter({ hasText: 'Inspect manual order calls' })
      .click({ force })
    return JSON.parse(
      await page
        .locator("output[aria-label='Manual order fixture calls']")
        .innerText({})
    )
  }
  const fillRequiredFields = async () => {
    await page.locator('#manual-order-phone').fill('+201001234567')
    await page.locator('#manual-order-total').fill('125.50')
  }

  await button('Reset manual order calls').click()
  await button(labels.open).press('Enter')
  await button(labels.submit).click()
  await page
    .getByText(labels.phoneRequired, { exact: true })
    .waitFor({ state: 'visible', timeoutMs: 10000 })
  const activeId = await page.evaluate(() => document.activeElement?.id)
  if (activeId !== 'manual-order-phone') {
    throw new Error('Validation did not focus the first invalid field')
  }

  await fillRequiredFields()
  await page
    .locator('#manual-order-fixture-outcome')
    .selectOption('held_success', {})
  await button(labels.submit).click()
  await button(labels.submitting).waitFor({
    state: 'visible',
    timeoutMs: 10000,
  })
  if (await button(labels.submitting).isEnabled()) {
    throw new Error('Pending submit remained enabled')
  }
  const pending = await inspect(true)
  if (pending.calls.length !== 1 || !pending.pending) {
    throw new Error('Double-submit protection did not retain one pending call')
  }
  await button('Resolve pending manual order').click()
  await page
    .getByText(labels.accepted, { exact: true })
    .waitFor({ state: 'visible', timeoutMs: 10000 })
  await page
    .getByText(labels.orderId, { exact: true })
    .waitFor({ state: 'visible', timeoutMs: 10000 })
  await button(labels.createAnother).click()
  if (
    (await page
      .locator('#manual-order-total')
      .evaluate((element) => element.value)) !== ''
  ) {
    throw new Error('Create-another did not reset the form')
  }

  await page
    .locator('#manual-order-fixture-outcome')
    .selectOption('network', {})
  await fillRequiredFields()
  await button(labels.submit).click()
  await page
    .getByText(labels.network, { exact: true })
    .waitFor({ state: 'visible', timeoutMs: 10000 })
  await page
    .locator('#manual-order-fixture-outcome')
    .selectOption('success', {})
  await button(labels.retry).click()
  await page
    .getByText(labels.accepted, { exact: true })
    .waitFor({ state: 'visible', timeoutMs: 10000 })
  await page
    .getByRole('button', { name: labels.close, exact: true })
    .first()
    .click()
  const retried = await inspect()
  const lastTwo = retried.calls.slice(-2)
  if (
    lastTwo.length !== 2 ||
    !lastTwo[0].token ||
    lastTwo[0].token !== lastTwo[1].token
  ) {
    throw new Error('Safe retry did not reuse the original token')
  }

  return { locale, pending, retried, passed: true }
}
