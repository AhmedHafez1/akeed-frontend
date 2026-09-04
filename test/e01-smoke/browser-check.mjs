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
