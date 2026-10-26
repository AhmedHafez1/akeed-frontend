import { TipCampaignEditorPage } from '@/features/admin/TipCampaignEditorPage'

export default async function TipCampaignEditorRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TipCampaignEditorPage id={decodeURIComponent(id)} />
}
