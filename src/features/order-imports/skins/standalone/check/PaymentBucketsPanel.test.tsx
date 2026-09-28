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

function Harness({ canEdit = true }: { canEdit?: boolean }) {
  const [payment, setPayment] = useState<
    Record<string, OrderImportPaymentClass>
  >({ cash: 'cod', visa: 'not_cod' })
  const [blankPayment, setBlankPayment] = useState<
    OrderImportPaymentClass | undefined
  >()
  return (
    <PaymentBucketsPanel
      column="Payment"
      values={values}
      form={{ payment, blankPayment }}
      assumeCodWhenBlank={false}
      open
      canEdit={canEdit}
      onOpen={() => undefined}
      onMove={(chip) => {
        const next = moveChip({ payment, blankPayment }, chip)
        setPayment(next.payment)
        setBlankPayment(next.blankPayment)
      }}
    />
  )
}

function renderPanel(canEdit = true) {
  return render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Harness canEdit={canEdit} />
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
    expect(
      within(skipGroup()).getByRole('button', {
        name: /No payment method/,
      })
    ).toBeTruthy()
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

  it('moves blank-payment orders and updates both bucket counts', () => {
    renderPanel()
    fireEvent.click(
      within(skipGroup()).getByRole('button', {
        name: /No payment method/,
      })
    )
    expect(
      within(confirmGroup()).getByRole('button', {
        name: /No payment method/,
      })
    ).toBeTruthy()
    expect(within(confirmGroup()).getByText('4 orders')).toBeTruthy()
    expect(within(skipGroup()).getByText('2 orders')).toBeTruthy()
  })

  it('keeps the blank chip non-interactive when read-only', () => {
    renderPanel(false)
    expect(within(skipGroup()).getByText('No payment method')).toBeTruthy()
    expect(
      within(skipGroup()).queryByRole('button', {
        name: /No payment method/,
      })
    ).toBeNull()
  })
})
