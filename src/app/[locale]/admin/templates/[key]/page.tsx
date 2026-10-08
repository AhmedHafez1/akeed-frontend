import { TemplateDetailAdminPage } from '@/features/admin/TemplateDetailAdminPage'

export default async function TemplateDetailAdminRoute({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  return <TemplateDetailAdminPage templateKey={decodeURIComponent(key)} />
}
