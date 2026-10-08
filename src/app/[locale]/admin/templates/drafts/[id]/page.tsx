import { TemplateDraftEditorPage } from '@/features/admin/TemplateDraftEditorPage'

export default async function TemplateDraftEditorRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TemplateDraftEditorPage draftId={decodeURIComponent(id)} />
}
