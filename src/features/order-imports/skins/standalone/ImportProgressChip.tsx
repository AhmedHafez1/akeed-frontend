'use client'

import Link from 'next/link'
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  PauseCircle,
  X,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { importModalPath, importOrdersPath } from '../../domain/importRoutes'
import type { ImportProgressChip as Chip } from '../../domain/importProgress'
import { useImportProgress } from '../../domain/useImportProgress'

const pill =
  'inline-flex h-11 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-9'

const toneOf = (chip: Chip) =>
  chip.kind === 'sending'
    ? 'border-info-border bg-info-subtle text-info-subtle-foreground'
    : chip.kind === 'paused'
      ? 'border-warning-border bg-warning-subtle text-warning-subtle-foreground'
      : chip.failed > 0
        ? 'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground'
        : 'border-primary-border bg-primary-subtle text-primary'

/**
 * The started import, in the top bar: "يُرسل 3 من 5" while it sends, then
 * what reached WhatsApp and what failed. It opens the confirmations list for
 * that import, whose rows move with it; a paused import opens its modal,
 * where it can be resumed. The region is polite-live, so the counts are read
 * out as they change.
 */
export function ImportProgressChip() {
  const t = useTranslations('orderImport.progress')
  const locale = useLocale() as SupportedLocale
  const progress = useImportProgress()

  return (
    <div role="status" aria-live="polite" className="flex items-center">
      {progress && (
        <ChipBody
          chip={progress.chip}
          fileName={progress.fileName}
          href={withLocale(
            progress.chip.kind === 'paused'
              ? importModalPath(progress.batchId)
              : importOrdersPath(progress.batchId),
            locale
          )}
          dismissLabel={t('dismiss')}
          onDismiss={progress.dismiss}
        />
      )}
    </div>
  )
}

function ChipBody({
  chip,
  fileName,
  href,
  dismissLabel,
  onDismiss,
}: {
  chip: Chip
  fileName: string
  href: string
  dismissLabel: string
  onDismiss: () => void
}) {
  const t = useTranslations('orderImport.progress')
  const label =
    chip.kind === 'sending'
      ? t('sending', { settled: chip.settled, total: chip.total })
      : chip.kind === 'paused'
        ? t('paused')
        : chip.failed > 0
          ? `${t('done', { delivered: chip.delivered, total: chip.total })} · ${t('doneFailed', { failed: chip.failed })}`
          : t('done', { delivered: chip.delivered, total: chip.total })
  const Icon =
    chip.kind === 'sending'
      ? Loader2
      : chip.kind === 'paused'
        ? PauseCircle
        : chip.failed > 0
          ? CircleAlert
          : CheckCircle2

  return (
    <span className={cn('inline-flex items-center', 'gap-1')}>
      <Link href={href} title={fileName} className={cn(pill, toneOf(chip))}>
        <Icon
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0',
            chip.kind === 'sending' && 'motion-safe:animate-spin'
          )}
        />
        {/* Phones get the numbers only; the name says it in full. */}
        <span className="sr-only sm:not-sr-only">{label}</span>
        {chip.kind !== 'paused' && (
          <bdi dir="ltr" aria-hidden="true" className="tabular-nums sm:hidden">
            {chip.kind === 'sending' ? chip.settled : chip.delivered}/
            {chip.total}
          </bdi>
        )}
      </Link>
      {chip.kind === 'done' && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring inline-flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none sm:size-8"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </span>
  )
}
