import { redirect } from 'next/navigation'

export default async function AdminPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item))
    else if (value !== undefined) query.set(key, value)
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  redirect(`/${locale}/admin/stores${suffix}`)
}
