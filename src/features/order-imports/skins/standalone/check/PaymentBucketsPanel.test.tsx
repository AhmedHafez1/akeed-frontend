import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../../../public/messages/en.json'
import type {
  OrderImportPaymentClass,
  OrderImportPaymentValues,
} from '../../../api/orderImportsApi'
import { moveChip } from '../../../domain/paymentBuckets'
import { PaymentBucketsPanel } from './PaymentBucketsPanel'

const values: OrderImportPaymentValues = {
  column: 'Payment',
  values: [
    {
      value: 'Cash',
      normalizedValue: 'cash',
      count: 3,
      classification: 'cod',
      autoClassification: 'cod',
      source: 'auto',
    },
    {
      value: 'Visa',
      normalizedValue: 'visa',
      count: 2,
      classification: 'not_cod',
      autoClassification: 'not_cod',
      source: 'auto',
    },
  ],
  blankCount: 1,
  distinctCount: 2,
  truncated: false,
}

function Harness() {
  const [payment, setPayment] = useState<
    Record<string, OrderImportPaymentClass>
  >({ cash: 'cod', visa: 'not_cod' })
  return (
    <PaymentBucketsPanel
      column="Payment"
      values={values}
      form={{ payment }}
      assumeCodWhenBlank={false}
      open
      canEdit
      onOpen={() => undefined}
      onMove={(chip) => setPayment(moveChip({ payment }, chip).payment)}
    />
  )
}

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Harness />
    </NextIntlClientProvider>
  )
}

const confirmGroup = () =>
  screen.getByRole('group', { name: 'Confirm · cash on delivery' })
const skipGroup = () =>
  screen.getByRole('group', { name: 'Skip · paid in advance' })

describe('PaymentBucketsPanel', () => {
  it('shows each value in its bucket with pressed state and counts', () => {
    renderPanel()
    const cash = within(confirmGroup()).getByRole('button', { name: /Cash/ })
    expect(cash.getAttribute('aria-pressed')).toBe('true')
    expect(within(confirmGroup()).getByText('3 orders')).toBeTruthy()
    const visa = within(skipGroup()).getByRole('button', { name: /Visa/ })
    expect(visa.getAttribute('aria-pressed')).toBe('false')
    // Blank cells: excluded by the store setting, shown but not movable.
    expect(within(skipGroup()).getByText('No value')).toBeTruthy()
    expect(within(skipGroup()).getByText('3 orders')).toBeTruthy()
  })

  it('moves a chip to the other bucket and updates both counts', () => {
    renderPanel()
    fireEvent.click(
      within(confirmGroup()).getByRole('button', { name: /Cash/ })
    )
    const cash = within(skipGroup()).getByRole('button', { name: /Cash/ })
    expect(cash.getAttribute('aria-pressed')).toBe('false')
    expect(within(confirmGroup()).getByText('0 orders')).toBeTruthy()
    expect(within(skipGroup()).getByText('6 orders')).toBeTruthy()
  })
})
