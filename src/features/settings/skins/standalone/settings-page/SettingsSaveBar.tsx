'use client'

import { AlertCircle, Loader2 } from 'lucide-react'

interface SettingsSaveBarProps {
  /** The region's name for assistive tech. */
  label: string
  message: string
  discardLabel: string
  saveLabel: string
  savingLabel: string
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
}

/**
 * The unsaved-changes bar, fixed to the bottom of the content column: from
 * `lg` it starts 280px in (the 248px sidebar plus the 32px page padding),
 * below that 16px from each edge. Below 640px the message takes its own row
 * and the two buttons share the row under it. An inverse surface so it reads
 * as sitting above the page; `settingsSaveBarClearance` keeps the last field
 * clear of it.
 */
/** Bottom padding for the page while the bar is showing. */
export const settingsSaveBarClearance = 'pb-44 sm:pb-36'

export function SettingsSaveBar({
  label,
  message,
  discardLabel,
  saveLabel,
  savingLabel,
  isSaving,
  onDiscard,
  onSave,
}: SettingsSaveBarProps) {
  return (
    <div
      role="region"
      aria-label={label}
      className="bg-inverse text-inverse-foreground shadow-ak-float text-ak-body fixed inset-x-4 bottom-5 z-30 flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[14px] py-2.5 ps-4.5 pe-2.5 motion-safe:animate-[fade-in_0.18s_var(--ease-out-quint)] lg:start-70 lg:end-8"
    >
      <span className="flex min-w-0 flex-1 basis-full items-center gap-2.5 pe-2 font-semibold sm:basis-0 sm:pe-0">
        <AlertCircle aria-hidden="true" className="size-4.5 shrink-0" />
        <span aria-live="polite">{message}</span>
      </span>
      <button
        type="button"
        onClick={onDiscard}
        disabled={isSaving}
        className="ak-focus border-inverse-foreground/20 rounded-ak-control hover:bg-inverse-foreground/10 h-10 flex-1 cursor-pointer border px-4 font-semibold disabled:pointer-events-none disabled:opacity-45 motion-safe:transition-colors motion-safe:duration-150 sm:flex-none"
      >
        {discardLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        aria-busy={isSaving}
        className="ak-focus bg-mint text-mint-foreground rounded-ak-control inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 px-4.5 font-bold hover:opacity-90 disabled:pointer-events-none motion-safe:transition-opacity motion-safe:duration-150 sm:flex-none"
      >
        {isSaving && (
          <Loader2
            aria-hidden="true"
            className="size-4 motion-safe:animate-spin"
          />
        )}
        {isSaving ? savingLabel : saveLabel}
      </button>
    </div>
  )
}
