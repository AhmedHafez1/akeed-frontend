'use client'
import { ChangePreparationPanel } from '@/features/admin/ChangePreparationPanel'
import { TemplateDraftEditorPage } from '@/features/admin/TemplateDraftEditorPage'
export default function AdminTemplatePreparationFixture() {
  return (
    <main className="bg-background text-foreground space-y-6 p-4 sm:p-6">
      <ChangePreparationPanel operator onPrepared={() => undefined} />
      <TemplateDraftEditorPage draftId="11111111-1111-4111-8111-111111111111" />
    </main>
  )
}
