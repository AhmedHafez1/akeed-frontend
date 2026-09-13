/**
 * Dashboard Feature — Public API
 *
 * Barrel export for the dashboard feature module.
 * Consumers should import from here, not from internal paths.
 */

// Domain
export { useDashboard } from './domain/useDashboard'
export { useVerificationsDashboard } from './domain/useVerificationsDashboard'
export {
  DASHBOARD_DATE_RANGE_IDS,
  VERIFICATION_STATUS_FILTER_IDS,
  buildVerificationsQuery,
} from './domain/verificationFilters'
export {
  canMarkOrderCanceled,
  canRetryVerification,
  hasCapability,
  isAwaitingOutcome,
  isTerminalLifecycleStatus,
  lifecycleTone,
  EXPLAINED_LIFECYCLE_REASONS,
} from './domain/verificationLifecycle'
export type { LifecycleTone } from './domain/verificationLifecycle'
export type {
  DashboardSkinProps,
  StatusFilterOption,
  TestFeedback,
} from './domain/dashboard.types'
export type {
  DashboardStats,
  DashboardStatsDateRange,
  DashboardStatsResponse,
  VerificationItem,
  VerificationRowAction,
  VerificationRowCapability,
  VerificationStatus,
  VerificationStatusFilter,
  VerificationsResponse,
} from './model/dashboard.model'

// Individual skins (for direct import if needed)
export { DashboardStandaloneSkin } from './skins/standalone'
export {
  DashboardEmbeddedSkin,
  DashboardEmbeddedShellSkeleton,
  MainEmbeddedSkin,
} from './skins/embedded'
export { DashboardVerificationsStandaloneSkin } from './skins/standalone'
export { DashboardVerificationsEmbeddedSkin } from './skins/embedded'
