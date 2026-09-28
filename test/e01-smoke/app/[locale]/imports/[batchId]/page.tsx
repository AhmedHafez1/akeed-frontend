'use client'

import { useParams } from 'next/navigation'
import { FixtureImportModal } from '../FixtureImportModal'
import { ImportFixtureFrame } from '../ImportFixtureFrame'

export default function OrderImportBatchFixturePage() {
  const { batchId } = useParams<{ batchId: string }>()
  return (
    <ImportFixtureFrame>
      <FixtureImportModal initial={batchId} />
    </ImportFixtureFrame>
  )
}
