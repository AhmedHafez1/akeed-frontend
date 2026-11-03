'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@/shared/ui'
import {
  changeTipRecipients,
  getTipDeliveryHistory,
  getTipRecipientOptions,
  getTipRecipients,
} from './adminTipsApi'
import {
  organizationLabel,
  recipientOperationIds,
  recipientState,
  type AdminTipCampaign,
  type AdminTipOrganization,
  type TipDeliveryHistory,
  type TipRecipientOperation,
} from './admin-tips.model'
import { TemplateConfirmDialog } from './TemplateWriteUi'
import { TipsErrorNotice, useTipsFormat } from './TipsAdminUi'
import { useOrganizationPages } from './useAdminTips'
import { useTemplateAction } from './useAdminTemplateDrafts'

function DeliveryHistory({
  campaignId,
  row,
}: {
  campaignId: string
  row: AdminTipOrganization
}) {
  const t = useTranslations('adminTips.membership')
  const format = useTipsFormat()
  const [items, setItems] = useState<TipDeliveryHistory[]>([])
  const [next, setNext] = useState<number | null | undefined>(undefined)
  const action = useTemplateAction<{
    items: TipDeliveryHistory[]
    next_before: number | null
  }>('Tips delivery history failed')
  const loading = useRef(false)
  const load = async () => {
    if (loading.current) return
    loading.current = true
    try {
      const page = await action.run(() =>
        getTipDeliveryHistory(campaignId, row.org_id, next ?? undefined)
      )
      if (page) {
        setItems((previous) => [...previous, ...page.items])
        setNext(page.next_before)
      }
    } finally {
      loading.current = false
    }
  }
  return (
    <details
      onToggle={(event) => {
        if (event.currentTarget.open && next === undefined) void load()
      }}
    >
      <summary className="text-primary focus-visible:ring-ring cursor-pointer rounded-sm focus-visible:ring-2">
        {t('history')}
      </summary>
      {action.error && (
        <TipsErrorNotice error={action.error} onRetry={() => void load()} />
      )}
      <ol className="mt-2 space-y-3">
        {items.map((item) => (
          <li
            key={item.delivery_generation}
            className="border-border space-y-1 border-s-2 ps-3 text-xs"
          >
            <p>
              {t('delivery', { generation: item.delivery_generation })}:{' '}
              {format.dateTime(item.delivery_started_at)}
            </p>
            <p>
              {t('viewed')}: {format.dateTime(item.first_viewed_at)}
            </p>
            <p>
              {t('clicked')}: {format.dateTime(item.first_clicked_at)}
            </p>
            <p>
              {t('dismissed')}: {format.dateTime(item.dismissed_at)}
            </p>
            <p>
              {t('removed')}: {format.dateTime(item.removed_at)}
            </p>
          </li>
        ))}
      </ol>
      {next === null && items.length === 0 && (
        <p className="text-muted-foreground mt-2 text-xs">{t('noHistory')}</p>
      )}
      {action.pending && <p role="status">{t('loading')}</p>}
      {next != null && (
        <Button
          type="button"
          variant="ghost"
          disabled={action.pending}
          onClick={() => void load()}
        >
          {t('loadMore')}
        </Button>
      )}
    </details>
  )
}

/** Explicit account membership; original publication filters stay unchanged. */
export function TipRecipientManager({
  campaign,
  refreshing,
  onApplied,
  onRefresh,
}: {
  campaign: AdminTipCampaign
  refreshing: boolean
  onApplied: (campaign: AdminTipCampaign) => void
  onRefresh: () => void
}) {
  const t = useTranslations('adminTips.membership')
  const format = useTipsFormat()
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(
    new Map<string, AdminTipOrganization>()
  )
  const [confirming, setConfirming] = useState<{
    operation: TipRecipientOperation
    ids: string[]
  } | null>(null)
  const [notice, setNotice] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const action = useTemplateAction<{
    campaign: AdminTipCampaign
    changed: number
    unchanged: number
  }>('Tips recipients change failed')
  const writing = useRef(false)
  const load = useCallback(
    (params: { search?: string; cursor?: string }) =>
      adding
        ? getTipRecipientOptions(campaign.id, params)
        : getTipRecipients(campaign.id, params),
    [adding, campaign.id]
  )
  const list = useOrganizationPages(load, {
    reloadKey: `${campaign.revision}:${adding}:${reloadKey}`,
  })
  const editable = ['published', 'paused'].includes(campaign.effective_status)
  const busy = action.pending || refreshing
  const selectedRows = [...selected.values()]
  const refresh = () => {
    setSelected(new Map())
    setReloadKey((value) => value + 1)
    onRefresh()
  }
  const toggle = (row: AdminTipOrganization, checked: boolean) => {
    setSelected((previous) => {
      const next = new Map(previous)
      if (checked) next.set(row.org_id, row)
      else next.delete(row.org_id)
      return next
    })
  }
  const apply = async () => {
    if (!confirming || writing.current) return
    writing.current = true
    try {
      const result = await action.run(() =>
        changeTipRecipients(campaign.id, {
          revision: campaign.revision,
          operation: confirming.operation,
          org_ids: confirming.ids,
        })
      )
      if (result) {
        setSelected(new Map())
        setConfirming(null)
        setNotice(result.changed)
        onApplied(result.campaign)
      } else {
        // The error lives beside the list; close the modal so it is accessible.
        setConfirming(null)
      }
    } finally {
      writing.current = false
    }
  }
  return (
    <section className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {t(editable ? 'description' : 'readOnly')}
      </p>
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={adding ? 'outline' : 'default'}
            disabled={busy}
            onClick={() => {
              setAdding(false)
              setSelected(new Map())
            }}
          >
            {t('recipients')}
          </Button>
          <Button
            type="button"
            variant={adding ? 'default' : 'outline'}
            disabled={busy}
            onClick={() => {
              setAdding(true)
              setSelected(new Map())
            }}
          >
            {t('findAccounts')}
          </Button>
        </div>
      )}
      <Input
        type="search"
        aria-label={t('search')}
        placeholder={t('search')}
        value={list.search}
        onChange={(event) => list.setSearch(event.target.value)}
      />
      {action.error && (
        <TipsErrorNotice error={action.error} onRetry={refresh} />
      )}
      {list.error && <TipsErrorNotice error={list.error} onRetry={refresh} />}
      {notice !== null && (
        <p role="status" className="text-success-subtle-foreground text-sm">
          {t('saved', { count: notice })}
        </p>
      )}
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {t('selected', { count: selected.size })}
          </span>
          <Button
            type="button"
            variant="ghost"
            disabled={busy || !list.items.length}
            onClick={() =>
              setSelected((previous) => {
                const next = new Map(previous)
                for (const row of list.items) {
                  if (next.size >= 500) break
                  if (!adding || recipientState(row) !== 'active')
                    next.set(row.org_id, row)
                }
                return next
              })
            }
          >
            {t('selectPage')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!selected.size || busy}
            onClick={() => setSelected(new Map())}
          >
            {t('clear')}
          </Button>
          {(['add', 'remove', 'reissue'] as const)
            .filter((operation) => adding || operation !== 'add')
            .map((operation) => {
              const ids = recipientOperationIds(selectedRows, operation)
              return (
                <Button
                  key={operation}
                  type="button"
                  variant="outline"
                  disabled={!ids.length || busy}
                  onClick={() => setConfirming({ operation, ids })}
                >
                  {t(`actions.${operation}`, { count: ids.length })}
                </Button>
              )
            })}
        </div>
      )}
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[680px] text-sm">
          <caption className="sr-only">{t('caption')}</caption>
          <thead className="bg-muted/60 text-muted-foreground text-xs">
            <tr>
              {editable && (
                <th scope="col" className="px-3 py-2 text-start">
                  {t('select')}
                </th>
              )}
              {(['merchant', 'state', 'activity', 'history'] as const).map(
                (column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-3 py-2 text-start font-medium"
                  >
                    {t(column)}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {list.items.map((row) => {
              const label = organizationLabel(row)
              const state = recipientState(row)
              const selectable = !adding || state !== 'active'
              return (
                <tr key={row.org_id}>
                  {editable && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        className="accent-primary focus-visible:ring-ring size-4 focus-visible:ring-2"
                        aria-label={t('selectAccount', { name: label })}
                        checked={selected.has(row.org_id)}
                        disabled={
                          busy ||
                          !selectable ||
                          (!selected.has(row.org_id) && selected.size >= 500)
                        }
                        onChange={(event) => toggle(row, event.target.checked)}
                      />
                    </td>
                  )}
                  <th scope="row" className="px-3 py-3 text-start font-normal">
                    <p className="text-foreground font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.shop_domain ?? row.platform}
                    </p>
                  </th>
                  <td className="px-3 py-3">
                    <p>{t(`states.${state}`)}</p>
                    {row.eligible === false && (
                      <p className="text-muted-foreground text-xs">
                        {t('inactive')}
                      </p>
                    )}
                    {row.delivery_generation && (
                      <p className="text-muted-foreground text-xs">
                        {t('delivery', { generation: row.delivery_generation })}
                      </p>
                    )}
                  </td>
                  <td className="space-y-1 px-3 py-3 text-xs">
                    <p>
                      {t('viewed')}: {format.dateTime(row.first_viewed_at)}
                    </p>
                    <p>
                      {t('clicked')}: {format.dateTime(row.first_clicked_at)}
                    </p>
                    <p>
                      {t('dismissed')}: {format.dateTime(row.dismissed_at)}
                    </p>
                    <p>
                      {t('removed')}: {format.dateTime(row.removed_at ?? null)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {row.delivery_generation ? (
                      <DeliveryHistory
                        key={row.org_id + ':' + row.delivery_generation}
                        campaignId={campaign.id}
                        row={row}
                      />
                    ) : (
                      t('noHistory')
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {list.loading && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('loading')}
        </p>
      )}
      {!list.loading && !list.items.length && (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      )}
      {list.hasMore && (
        <Button
          type="button"
          variant="outline"
          disabled={list.loading}
          onClick={list.loadMore}
        >
          {t('loadMore')}
        </Button>
      )}
      <TemplateConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open && !action.pending) setConfirming(null)
        }}
        title={t('confirmTitle')}
        description={
          confirming
            ? t(`confirm.${confirming.operation}`, {
                count: confirming.ids.length,
              }) +
              (campaign.status === 'paused' && confirming.operation !== 'remove'
                ? ' ' + t('pausedNote')
                : '')
            : ''
        }
        confirmLabel={
          confirming
            ? t(`actions.${confirming.operation}`, {
                count: confirming.ids.length,
              })
            : t('confirmTitle')
        }
        pending={action.pending}
        onConfirm={() => void apply()}
      />
    </section>
  )
}
