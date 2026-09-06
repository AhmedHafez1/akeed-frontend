import type { LifecycleTone } from '../../domain/verificationLifecycle'

/**
 * The semantic lifecycle tones rendered in the standalone design system.
 *
 * The single Tailwind mapping for the whole standalone skin — the table, the
 * dashboard summary and anything added later. Embedded has one equivalent for
 * Polaris. Two maps, one per design system, rather than one per component.
 */
export const lifecycleToneClasses: Record<LifecycleTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  progress: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-purple-200 bg-purple-50 text-purple-700',
  attention: 'border-amber-200 bg-amber-50 text-amber-800',
  critical: 'border-red-200 bg-red-50 text-red-700',
}
