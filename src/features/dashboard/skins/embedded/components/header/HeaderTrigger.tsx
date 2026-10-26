'use client'

import type { CSSProperties, ReactNode, Ref } from 'react'
import { Icon, Spinner } from '@shopify/polaris'
import type { IconSource } from '@shopify/polaris'
import { ChevronDownIcon } from '@shopify/polaris-icons'
import { HEADER_TRIGGER_ATTRIBUTE } from './HeaderPanel'

export type HeaderTriggerTone = 'neutral' | 'warning' | 'critical'

const TONES: Record<HeaderTriggerTone, CSSProperties> = {
  neutral: {
    background: 'var(--p-color-bg-surface)',
    borderColor: 'var(--p-color-border)',
    color: 'var(--p-color-text)',
  },
  warning: {
    background: 'var(--p-color-bg-surface-warning)',
    borderColor: 'var(--p-color-border-caution)',
    color: 'var(--p-color-text-caution)',
  },
  critical: {
    background: 'var(--p-color-bg-surface-critical)',
    borderColor: 'var(--p-color-border-critical)',
    color: 'var(--p-color-text-critical)',
  },
}

interface HeaderTriggerProps {
  ref?: Ref<HTMLButtonElement>
  icon: IconSource
  label: ReactNode
  expanded: boolean
  controls: string
  tone?: HeaderTriggerTone
  loading?: boolean
  onClick: () => void
}

/**
 * A labelled header button that opens a panel. The label carries the state
 * (the count), so the tone is never the only signal. No unread dot or badge.
 */
export function HeaderTrigger({
  ref,
  icon,
  label,
  expanded,
  controls,
  tone = 'neutral',
  loading,
  onClick,
}: HeaderTriggerProps) {
  return (
    <button
      ref={ref}
      type="button"
      {...{ [HEADER_TRIGGER_ATTRIBUTE]: '' }}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      aria-busy={loading || undefined}
      onClick={onClick}
      className="inline-flex max-w-full cursor-pointer items-center gap-2 border text-start text-(length:--p-font-size-400) leading-(--p-font-line-height-600) focus-visible:outline-2 focus-visible:outline-offset-1 md:text-(length:--p-font-size-325) md:leading-(--p-font-line-height-500)"
      style={{
        ...TONES[tone],
        borderRadius: 'var(--p-border-radius-200)',
        borderWidth: 'var(--p-border-width-025)',
        // The period Select's own sizing, so the row lines up at every width.
        minHeight: 'var(--pg-control-height)',
        padding: 'var(--p-space-150) var(--p-space-300)',
        fontWeight: 'var(--p-font-weight-medium)',
        outlineColor: 'var(--p-color-border-focus)',
      }}
    >
      <span className="shrink-0" aria-hidden="true">
        {loading ? (
          <Spinner size="small" />
        ) : (
          <Icon source={icon} tone="inherit" />
        )}
      </span>
      <span className="min-w-0">{label}</span>
      <span
        className={`shrink-0 transition-transform duration-[120ms] motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
        aria-hidden="true"
      >
        <Icon source={ChevronDownIcon} tone="inherit" />
      </span>
    </button>
  )
}
