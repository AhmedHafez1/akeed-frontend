import type { LifecycleTone } from '../../domain/verificationLifecycle'

/**
 * The semantic lifecycle tones rendered in the standalone design system.
 *
 * The single Tailwind mapping for the whole standalone skin — the table, the
 * dashboard summary and anything added later. Embedded has one equivalent for
 * Polaris. Two maps, one per design system, rather than one per component.
 */
export const lifecycleToneClasses: Record<LifecycleTone, string> = {
  neutral: 'border-border bg-muted/50 text-foreground/80',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  progress: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  success: 'border-primary-border bg-primary-subtle text-primary',
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  attention:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  critical:
    'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
  muted: 'border-border bg-muted text-muted-foreground',
}
