'use client'

import { useParams } from 'next/navigation'
import { OrderImportBatchStandalone } from '@/features/order-imports'
import { ImportFixtureFrame } from '../ImportFixtureFrame'

export default function OrderImportBatchFixturePage() {
  const { batchId } = useParams<{ batchId: string }>()
  return (
    <ImportFixtureFrame>
      <OrderImportBatchStandalone batchId={batchId} />
    </ImportFixtureFrame>
  )
}
