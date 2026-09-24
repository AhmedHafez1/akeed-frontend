import { redirect } from 'next/navigation'

/** Old Settings URL; its fields now live on the Settings "message" tab. */
export default async function MessagePreviewPage({
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
  query.set('tab', 'message')
  redirect(`/${locale}/settings?${query.toString()}`)
}
