/** One text template and its image-header twin, if it has one. */
export interface ImageTwinParent {
  key: string
  template_name: string
  language_code: string
  twin: {
    template_name: string
    is_active: boolean
    review_status: string | null
  } | null
}

export interface ImageTwinOverview {
  meta_app_configured: boolean
  parents: ImageTwinParent[]
}

export type ImageTwinOutcome =
  | 'created'
  | 'adopted'
  | 'skipped'
  | 'failed'
  | 'unresolved'
  | 'not_attempted'

export interface ImageTwinResult {
  parent_key: string
  parent_template_name: string
  language_code: string
  twin_template_name: string | null
  outcome: ImageTwinOutcome
  reason: string | null
  provider_code: number | null
  review_status: string | null
}

export interface ImageTwinActivation {
  activated: string[]
  waiting: { key: string; review_status: string | null }[]
}

export interface ImageTwinCounts {
  parents: number
  twins: number
  approved: number
  active: number
  /** Templates with no twin yet: what "Create missing twins" submits. */
  missing: number
}

export function imageTwinCounts(parents: readonly ImageTwinParent[]) {
  const twins = parents.flatMap((parent) => (parent.twin ? [parent.twin] : []))
  return {
    parents: parents.length,
    twins: twins.length,
    approved: twins.filter((twin) => twin.review_status === 'approved').length,
    active: twins.filter((twin) => twin.is_active).length,
    missing: parents.length - twins.length,
  } satisfies ImageTwinCounts
}

/** Badge tone of a run's outcome. */
export function imageTwinOutcomeTone(
  outcome: ImageTwinOutcome
): 'success' | 'neutral' | 'danger' | 'warning' {
  if (outcome === 'created' || outcome === 'adopted') return 'success'
  if (outcome === 'skipped') return 'neutral'
  if (outcome === 'failed') return 'danger'
  return 'warning'
}
