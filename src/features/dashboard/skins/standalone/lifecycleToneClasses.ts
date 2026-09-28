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
  info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
  // Read is further along than sent, but the same family: the info trio,
  // emphasized, rather than a second hue.
  progress:
    'border-info-border bg-info-subtle text-info-subtle-foreground ring-info-border ring-1 ring-inset',
  success: 'border-primary-border bg-primary-subtle text-primary',
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  attention:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  critical:
    'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
  muted: 'border-border bg-muted text-muted-foreground',
}
