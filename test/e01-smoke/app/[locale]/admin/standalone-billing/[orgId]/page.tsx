import { StandaloneBillingAccountPage } from '@/features/admin/StandaloneBillingAccountPage'

export default async function StandaloneBillingAccountFixturePage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  return <StandaloneBillingAccountPage orgId={orgId} />
}
