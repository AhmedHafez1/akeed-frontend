import { redirect } from 'next/navigation'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item))
    else if (value !== undefined) query.set(key, value)
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  redirect(`/en/admin/stores${suffix}`)
}
