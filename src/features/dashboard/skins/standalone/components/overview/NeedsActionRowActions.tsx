'use client'

import Link from 'next/link'
import {
  Check,
  CheckCircle2,
  Ellipsis,
  List,
  MessageCircle,
  PackageX,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  akButton,
} from '@/shared/ui'
import type { NeedsActionRowModel } from '@/features/dashboard/domain/needsActionRow'
import type { ManualConfirmationTarget } from '@/features/dashboard/domain/useManualConfirmation'
import { ContactMenuItems } from '../confirmations/ContactMenuItems'

/**
 * A needs-action row's actions, laid out like the confirmations table's: in
 * the table every action sits behind one labelled "more" menu; on a card
 * Confirm and WhatsApp sit up front at 40px and the menu keeps the rest.
 */
export function NeedsActionRowActions({
  row,
  target,
  customerLabel,
  listHref,
  handleHref,
  onRequestConfirm,
  onRequestCancel,
  layout = 'inline',
}: {
  row: NeedsActionRowModel
  target: ManualConfirmationTarget
  customerLabel: string
  listHref: string
  /** Opens the order's change request; used only for such a row. */
  handleHref: string
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onRequestCancel: (target: ManualConfirmationTarget) => void
  layout?: 'inline' | 'stacked'
}) {
  const t = useTranslations('dashboard')
  const tRow = useTranslations('dashboard.standalone.needsAction')
  const inline = layout === 'inline'
  const whatsappLabel = t('overview.needsAction.actions.whatsappLabel', {
    customer: customerLabel,
  })
  const confirmLabel = t('overview.needsAction.actions.manualConfirmLabel', {
    order: target.orderLabel,
  })
  const tChange = useTranslations('dashboard.changeRequest')

  if (row.changeRequest) {
    const { contact } = row.changeRequest
    return (
      <div className={cn('flex items-center gap-2', inline && 'justify-end')}>
        {!inline && (
          <Link
            href={handleHref}
            className={cn(
              akButton({ variant: 'tinted', size: 'md' }),
              'min-w-0 flex-1'
            )}
          >
            {tChange('handle')}
          </Link>
        )}
        {!inline && contact && (
          <a
            href={contact.whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={whatsappLabel}
            className={akButton({ variant: 'secondary', size: 'iconMd' })}
          >
            <MessageCircle aria-hidden="true" />
          </a>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={tRow('more', { order: target.orderLabel })}
              className={akButton({
                variant: inline ? 'ghost' : 'secondary',
                size: inline ? 'iconTable' : 'iconMd',
              })}
            >
              <Ellipsis aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={handleHref} className="font-semibold">
                <PackageX aria-hidden="true" className="size-4" />
                {tChange('handle')}
              </Link>
            </DropdownMenuItem>
            <ContactMenuItems contact={contact} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', inline && 'justify-end')}>
      {!inline && row.confirmable && (
        <button
          type="button"
          aria-label={confirmLabel}
          onClick={() => onRequestConfirm(target)}
          className={cn(
            akButton({ variant: 'tinted', size: 'md' }),
            'min-w-0 flex-1'
          )}
        >
          <Check aria-hidden="true" strokeWidth={2.5} />
          {tRow('confirm')}
        </button>
      )}
      {!inline && row.chatUrl && (
        <a
          href={row.chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={whatsappLabel}
          className={cn(
            akButton({ variant: 'secondary', size: 'md' }),
            'min-w-0 flex-1'
          )}
        >
          <MessageCircle aria-hidden="true" />
          <span className="truncate">
            {t('overview.needsAction.actions.whatsapp')}
          </span>
        </a>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={tRow('more', { order: target.orderLabel })}
            className={akButton({
              variant: inline ? 'ghost' : 'secondary',
              size: inline ? 'iconTable' : 'iconMd',
            })}
          >
            <Ellipsis aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {inline && row.chatUrl && (
            <DropdownMenuItem asChild>
              <a
                href={row.chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={whatsappLabel}
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                {t('overview.needsAction.actions.whatsapp')}
              </a>
            </DropdownMenuItem>
          )}
          {inline && row.confirmable && (
            <DropdownMenuItem onSelect={() => onRequestConfirm(target)}>
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {tRow('confirm')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={listHref}>
              <List aria-hidden="true" className="size-4" />
              {tRow('viewInList')}
            </Link>
          </DropdownMenuItem>
          {row.cancelable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onSelect={() => onRequestCancel(target)}
              >
                <XCircle aria-hidden="true" className="size-4" />
                {tRow('cancel')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
