'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbulb, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button, Input } from '@/shared/ui'
import { AdminEmptyState, AdminPageHeader, AdminSelect } from './AdminUi'
import type { TipStatus } from './admin-tips.model'
import { TipStatusBadge, TipsErrorNotice, useTipsFormat } from './TipsAdminUi'
import { useTipCampaigns } from './useAdminTips'

const STATUSES: TipStatus[] = ['draft', 'published', 'paused', 'archived']

/** Every tips and updates campaign, newest first, with its reach. */
export function TipsAdminPage() {
  const t = useTranslations('adminTips')
  const { locale } = useLocaleInfo()
  const format = useTipsFormat()
  const [status, setStatus] = useState<TipStatus | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [cursors, setCursors] = useState<string[]>([])
  const cursor = cursors[cursors.length - 1]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setCursors([])
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const list = useTipCampaigns({
    status: status || undefined,
    search: search || undefined,
    cursor,
  })
  const items = list.data?.items ?? []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href={`/${locale}/admin/tips/new`}>
              <Plus className="size-4" aria-hidden="true" />
              {t('list.create')}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1">
          <span className="text-foreground/70 mb-1.5 block text-xs font-medium">
            {t('list.search')}
          </span>
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('list.searchPlaceholder')}
          />
        </label>
        <AdminSelect
          className="sm:w-56"
          label={t('list.status')}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TipStatus | '')
            setCursors([])
          }}
          options={[
            { value: '', label: t('list.allStatuses') },
            ...STATUSES.map((value) => ({
              value,
              label: t(`status.${value}`),
            })),
          ]}
        />
      </div>

      {list.error && (
        <TipsErrorNotice error={list.error} onRetry={list.refresh} />
      )}

      {!list.error && !list.loading && items.length === 0 ? (
        <AdminEmptyState
          icon={Lightbulb}
          title={t('list.emptyTitle')}
          description={t('list.emptyBody')}
        />
      ) : (
        <div className="border-border bg-card overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[960px] text-sm">
            <caption className="sr-only">{t('list.caption')}</caption>
            <thead className="bg-muted/60 text-muted-foreground text-xs">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t('list.columns.name')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t('list.columns.status')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t('list.columns.published')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t('list.columns.expires')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('analytics.recipients')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('analytics.viewed')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('analytics.clicked')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('analytics.dismissed')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/admin/tips/${item.id}`}
                      className="text-foreground font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {t(`type.${item.type}`)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <TipStatusBadge status={item.effective_status} />
                  </td>
                  <td className="text-foreground/80 px-4 py-3">
                    {format.dateTime(item.published_at)}
                  </td>
                  <td className="text-foreground/80 px-4 py-3">
                    {item.expires_at
                      ? format.dateTime(item.expires_at)
                      : t('noExpiry')}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {format.count(item.analytics.recipients)}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {format.count(item.analytics.viewed)}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {item.has_action
                      ? format.count(item.analytics.clicked)
                      : t('analytics.noButton')}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {format.count(item.analytics.dismissed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {cursors.length > 0 && (
          <Button variant="outline" onClick={() => setCursors([])}>
            {t('list.firstPage')}
          </Button>
        )}
        {list.data?.next_cursor && (
          <Button
            variant="outline"
            onClick={() =>
              setCursors((previous) => [...previous, list.data!.next_cursor!])
            }
          >
            {t('list.nextPage')}
          </Button>
        )}
      </div>
    </div>
  )
}
