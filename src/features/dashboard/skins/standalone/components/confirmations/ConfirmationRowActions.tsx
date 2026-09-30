'use client'

import {
  CheckCircle2,
  Ellipsis,
  Eye,
  MessageCircle,
  RotateCcw,
  Truck,
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
import { planConfirmationRowActions } from '@/features/dashboard/domain/confirmationRowActions'
import { useConfirmationRowLink } from '@/features/dashboard/domain/useConfirmationRowLink'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import type { ConfirmationsListProps } from './confirmationCells'

/**
 * In the table: one labelled "more" menu holds every action — details, the
 * WhatsApp or shipping link, manual confirm, retry, cancel — so rows stay
 * quiet. On a card only the link sits up front as a 40px button, and the
 * menu keeps the rest, Confirm included. The shared plan decides
 * which actions exist, so both modes offer the same ones.
 */
export function ConfirmationRowActions({
  row,
  orderLabel,
  canWrite,
  canRetry,
  isActing,
  isAnyActing,
  handlers,
  layout = 'inline',
}: {
  row: VerificationItem
  orderLabel: string
  canWrite: boolean
  canRetry: boolean
  isActing: boolean
  isAnyActing: boolean
  handlers: ConfirmationsListProps['handlers']
  /** `stacked` stretches the main link across a card. */
  layout?: 'inline' | 'stacked'
}) {
  const t = useTranslations('dashboard')
  const plan = planConfirmationRowActions(row, { canWrite, canRetry })
  const link = useConfirmationRowLink(row, orderLabel, plan.primary)

  // A row shown ahead of the server has no details or actions yet.
  if (row.optimistic) return null
  const LinkIcon = plan.primary === 'shipping' ? Truck : MessageCircle

  const inline = layout === 'inline'

  return (
    <div
      className={cn('flex items-center gap-2', inline ? 'justify-end' : 'pt-1')}
    >
      {!inline && link && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.accessibilityLabel}
          className={cn(
            akButton({ variant: 'secondary', size: 'md' }),
            'min-w-0 flex-1'
          )}
        >
          <LinkIcon aria-hidden="true" />
          <span className="truncate">{link.content}</span>
        </a>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('confirmations.actions.more', { order: orderLabel })}
            aria-busy={isActing || undefined}
            className={akButton({
              variant: inline ? 'ghost' : 'secondary',
              size: inline ? 'iconTable' : 'iconMd',
            })}
          >
            <Ellipsis
              aria-hidden="true"
              className={cn(isActing && 'animate-pulse')}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handlers.onOpenDetails(row)}>
            <Eye aria-hidden="true" className="size-4" />
            {t('table.actions.details')}
          </DropdownMenuItem>
          {inline && link && (
            <DropdownMenuItem asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.accessibilityLabel}
              >
                <LinkIcon aria-hidden="true" className="size-4" />
                {link.content}
              </a>
            </DropdownMenuItem>
          )}
          {plan.canConfirm && (
            <DropdownMenuItem
              disabled={isAnyActing}
              onSelect={() => handlers.onRequestConfirm(row, orderLabel)}
            >
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {t('overview.needsAction.actions.manualConfirm')}
            </DropdownMenuItem>
          )}
          {plan.canRetry && (
            <DropdownMenuItem
              disabled={isAnyActing}
              onSelect={() => handlers.onRetry(row)}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {isActing
                ? t('table.actions.retrying')
                : t('table.actions.retry')}
            </DropdownMenuItem>
          )}
          {plan.canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                disabled={isAnyActing}
                onSelect={() => handlers.onRequestCancel(row, orderLabel)}
              >
                <XCircle aria-hidden="true" className="size-4" />
                {t('table.actions.cancelOrder')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
