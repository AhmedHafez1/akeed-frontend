import { StoreDetailsAdminPage } from '@/features/admin/StoreDetailsAdminPage'

export default async function AdminStoreDetailsFixturePage({
  params,
}: {
  params: Promise<{ integrationId: string }>
}) {
  const { integrationId } = await params
  return <StoreDetailsAdminPage integrationId={integrationId} />
}
