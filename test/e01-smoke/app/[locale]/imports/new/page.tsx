'use client'

import { OrderImportNewStandalone } from '@/features/order-imports'
import { ImportFixtureFrame } from '../ImportFixtureFrame'

export default function OrderImportNewFixturePage() {
  return (
    <ImportFixtureFrame>
      <OrderImportNewStandalone />
    </ImportFixtureFrame>
  )
}
