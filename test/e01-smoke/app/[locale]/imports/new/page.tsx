'use client'

import { FixtureImportModal } from '../FixtureImportModal'
import { ImportFixtureFrame } from '../ImportFixtureFrame'

export default function OrderImportNewFixturePage() {
  return (
    <ImportFixtureFrame>
      <FixtureImportModal initial="new" />
    </ImportFixtureFrame>
  )
}
